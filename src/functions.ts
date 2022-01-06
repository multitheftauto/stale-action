import * as core from '@actions/core';

import type {
  CreateLabelMutation,
  NodeID,
  PullRequestObject,
  PullRequestsQuery,
  RepositoryQuery,
  RepositoryWithLabel
} from './types';

import {graphql} from '@octokit/graphql';

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${core.getInput('repo-token')}`
  }
});

/**
 * Create a new label in a repository.
 * @param repositoryId The Node ID of the repository.
 * @param name The name of the label.
 * @param color A 6 character hex code, without the leading #, identifying the color of the label.
 * @param description A brief description of the label, such as its purpose.
 * @returns The newly created label's Node ID, or undefined, if couldn't be created.
 */
export const createLabel = async (
  repositoryId: NodeID,
  name: string,
  color: string,
  description = ''
): Promise<NodeID | undefined> => {
  const {createLabel: createdLabel}: CreateLabelMutation =
    await graphqlWithAuth(
      `
      mutation createLabel($input: CreateLabelInput!) {
        createLabel(input: $input) {
          label {
            id
          }
        }
      }
    `,
      {
        input: {
          color,
          description,
          name,
          repositoryId
        },
        headers: {
          accept: 'application/vnd.github.bane-preview+json'
        }
      }
    );

  if (createdLabel && createdLabel.label) {
    return createdLabel.label.id;
  }
};

/**
 * Get a repository object and a label within it.
 * @param owner The login field of a user or organization.
 * @param repo The name of the repository.
 * @param labelName Label name.
 * @returns A repository object with the requested label, or undefined, if repository could not be found.
 */
export const getRepositoryAndLabelWithin = async (
  owner: string,
  repo: string,
  labelName: string
): Promise<RepositoryWithLabel | undefined> => {
  const {repository}: RepositoryQuery = await graphqlWithAuth(
    `
      query getRepositoryAndLabelWithin($repo: String!, $owner: String!, $labelName: String!) {
        repository(name: $repo, owner: $owner) {
          id,
          label(name: $labelName) {
            id
          }
        }
      }
    `,
    {
      repo,
      owner,
      labelName
    }
  );

  if (repository) {
    return repository;
  }
};

/**
 * Get open draft pull requests for a repository.
 * @param owner The login field of a user or organization.
 * @param repo The name of the repository.
 * @param ignoredLabelName Name of the label to ignore.
 * @returns A list of search results.
 */
export const getOpenDraftPullRequests = async (
  owner: string,
  repo: string,
  ignoredLabelName = ''
): Promise<PullRequestsQuery> => {
  return new Promise(async (resolve, reject) => {
    try {
      let issueCount = 0;
      let hasNextPage = true;
      let lastCursor: string | undefined;
      const nodes: PullRequestObject[] = [];

      while (hasNextPage) {
        const {search}: PullRequestsQuery = await graphqlWithAuth(
          `
          query PullRequestsQuery($search: String!, $cursor: String) {
            search(after: $cursor, first: 1, type: ISSUE, query: $search) {
              issueCount
              nodes {
                ... on PullRequest {
                  id
                  labels(first: 5) {
                    nodes {
                      name
                    }
                  }
                  number
                  updatedAt
                }
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        `,
          {
            search: `repo:${owner}/${repo} is:pr is:open is:draft${
              ignoredLabelName ? ` -label:${ignoredLabelName}` : ''
            }`,
            cursor: lastCursor
          }
        );

        if (search) {
          const {
            issueCount: _issueCount,
            nodes: _nodes = [],
            pageInfo: {endCursor = '', hasNextPage: _hasNextPage}
          } = search;

          issueCount = _issueCount;
          lastCursor = endCursor;
          hasNextPage = _hasNextPage;

          for (const node of _nodes) {
            nodes.push(node);
          }
        } else {
          throw new Error('Search failed.');
        }
      }

      resolve({
        search: {
          issueCount,
          nodes,
          pageInfo: {endCursor: lastCursor, hasNextPage}
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Add labels to a labelable.
 * @param labelableId The Node ID of the labelable object to add labels to.
 * @param labelIds The Node IDs of the labels to add.
 * @returns The Node ID of the labelable.
 */
export const addLabels = async (labelableId: NodeID, labelIds: NodeID[]) => {
  return graphqlWithAuth(
    `
      mutation ($input: AddLabelsToLabelableInput!) {
        addLabelsToLabelable(input: $input) {
          labelable {
            ... on PullRequest {
              id
            }
          }
        }
      }
    `,
    {
      input: {
        labelIds,
        labelableId
      }
    }
  );
};

/**
 * Add a comment to a subject.
 * @param subjectId The Node ID of the subject to modify.
 * @param body The contents of the comment.
 * @returns The Node ID of the posted comment.
 */
export const addComment = async (subjectId: NodeID, body: string) => {
  return graphqlWithAuth(
    `
      mutation ($input: AddCommentInput!) {
        addComment(input: $input) {
          commentEdge {
            node {
              id
            }
          }
        }
      }
    `,
    {
      input: {
        body,
        subjectId
      }
    }
  );
};

/**
 * Close a pull request.
 * @param id ID of the pull request to be closed.
 * @returns The Node ID of the pull request that was closed.
 */
export const closePullRequest = async (id: NodeID) => {
  return graphqlWithAuth(
    `
      mutation ($input: ClosePullRequestInput!) {
        closePullRequest(input: $input) {
          pullRequest {
            id
          }
        }
      }
    `,
    {
      input: {
        pullRequestId: id
      }
    }
  );
};
