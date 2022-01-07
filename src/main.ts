import * as core from '@actions/core';
import * as github from '@actions/github';

import {
  addComment,
  addLabels,
  closePullRequest,
  createLabel,
  getOpenDraftPullRequests,
  getRepositoryAndLabelWithin
} from './functions';

(async () => {
  try {
    const stalePrLabelName = core.getInput('stale-pr-label');

    const repository = await getRepositoryAndLabelWithin(
      github.context.repo.owner,
      github.context.repo.repo,
      stalePrLabelName
    );

    if (!repository) {
      throw new Error('Repository not found.');
    }

    let maybeStalePrLabelId = '';

    if (repository.label) {
      maybeStalePrLabelId = repository.label.id;
    } else {
      core.info(
        `Could not find stale label named "${stalePrLabelName}", so creating a new one...`
      );

      const id = await createLabel(
        repository.id,
        stalePrLabelName,
        core.getInput('stale-pr-label-color'),
        core.getInput('stale-pr-label-description')
      );

      if (!id) {
        throw new Error(`Could not create label ${stalePrLabelName}.`);
      }

      core.info(`Created a new stale label named "${stalePrLabelName}".`);

      maybeStalePrLabelId = id;
    }

    const ignoredLabelName = core.getInput('ignored-label');
    const {search} = await getOpenDraftPullRequests(
      github.context.repo.owner,
      github.context.repo.repo,
      ignoredLabelName
    );

    if (!search) {
      throw new Error('An error occurred when querying for pull requests.');
    }

    if (search.issueCount === 0 || !search.nodes) {
      core.info('No pull requests found. Stopping.');

      return;
    }

    core.info(`Found ${search.issueCount} matching issues to check.`);

    const stalePrMessage = core.getInput('stale-pr-message');
    const closePrMessage = core.getInput('close-pr-message');
    const stalePrLabelId = maybeStalePrLabelId;
    const daysBeforePrStale = parseInt(
      core.getInput('days-before-pr-stale'),
      10
    );
    const daysBeforePrClose = parseInt(
      core.getInput('days-before-pr-close'),
      10
    );

    let numberOfStaleLabeableFound = 0;
    const newStaled: number[] = [];
    let numberOfStaleClosableFound = 0;
    const newClosed: number[] = [];

    core.startGroup('Labeling process');

    await Promise.allSettled(
      search.nodes.map(async ({id, labels, number, updatedAt}) => {
        try {
          // If the pull request is not labeled stale yet
          if (
            labels.nodes &&
            !labels.nodes.find(({name}) => name === 'stale')
          ) {
            if (
              daysBeforePrStale >= 0 &&
              new Date(updatedAt) <=
                new Date(Date.now() - daysBeforePrStale * 24 * 60 * 60 * 1000)
            ) {
              core.info(`Labeling #${number} as stale...`);

              numberOfStaleLabeableFound += 1;

              // Add stale label
              if (await addLabels(id, [stalePrLabelId])) {
                newStaled.push(number);

                // Post stale comment if provided
                if (stalePrMessage) {
                  core.info(`Posting comment on #${number} about it...`);

                  await addComment(id, stalePrMessage);
                }
              }
            }
          } else if (
            daysBeforePrClose >= 0 &&
            new Date(updatedAt) <=
              new Date(Date.now() - daysBeforePrClose * 24 * 60 * 60 * 1000)
          ) {
            core.info(`Closing #${number} as stale...`);

            numberOfStaleClosableFound += 1;

            // Close pull request
            if (await closePullRequest(id)) {
              newClosed.push(number);

              // Post stale closed comment if provided
              if (closePrMessage) {
                core.info(`Posting comment on #${number} about it...`);

                await addComment(id, closePrMessage);
              }
            }
          }
        } catch (e) {
          core.setFailed(`${e}`);
        }
      })
    );

    core.endGroup();

    core.notice(
      `Staled ${newStaled.length} out of ${numberOfStaleLabeableFound} found new draft pull requests.`
    );
    core.setOutput('staled-prs', newStaled);

    core.notice(
      `Closed ${newClosed.length} out of ${numberOfStaleClosableFound} found old draft pull requests.`
    );
    core.setOutput('closed-prs', newClosed);
  } catch (e) {
    core.setFailed(`${e}`);
  }
})();
