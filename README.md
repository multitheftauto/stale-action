# Close Stale Draft Pull Requests

This action has been inspired by [microsoft/vscode-github-triage-actions](https://github.com/microsoft/vscode-github-triage-actions), [actions/stale](https://github.com/actions/stale) and [probot/stale](https://github.com/probot/stale), ultimately written from scratch for our use using newer versions of the APIs, but same or similar configuration syntax and linting options enabled.

Notifies and then closes draft pull requests that have had no activity for a specified amount of time.

The configuration must be on the default branch and the default values will:

- Add a label "stale" on draft pull requests after 90 days of inactivity
- Close the stale draft pull requests after 30 days of inactivity
- If an update/comment occur on stale draft pull requests, the stale label will be removed and the timer will restart

## Todos

- Automatically generate accurate TypeScript definitions from GraphQL schemas

## Recommended permissions

For the execution of this action, it must be able to fetch all pull requests from your repository.
In addition, based on the provided configuration, the action could require more permission(s) (e.g. create label, add label, comment, close, etc.)
This can be achieved with the following [configuration in the top level of the action](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#permissions) if the permissions are restricted:

```yaml
permissions:
  pull-requests: write
```

## All options

### List of input options

Every argument is optional.

| Input                                                     | Description                                                                                                        | Default               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------- |
| [close-pr-message](#close-pr-message)                     | The message to post on the stale draft pull request that is being closed.                                          |                       |
| [days-before-pr-close](#days-before-pr-close)             | The number of days to wait to close a pull request after it being marked stale with no activity afterwards.        | 30                    |
| [days-before-pr-stale](#days-before-pr-stale)             | The number of days old a draft pull request can be before marking it stale.                                        | 90                    |
| [ignored-label](#ignored-label)                           | Draft pull requests with this label will not be processed.                                                         |                       |
| [repo-token](#repo-token)                                 | Token for the repository. Can be passed in using `{{ secrets.GITHUB_TOKEN }}`.                                     | `${{ github.token }}` |
| [stale-pr-label](#stale-pr-label)                         | The label to apply when a draft pull request is stale.                                                             | `stale`               |
| [stale-pr-label-color](#stale-pr-label-color)             | A 6 character hex code, without the leading #, identifying the color of the stale label if it needs to be created. | `555555`              |
| [stale-pr-label-description](#stale-pr-label-description) | A description for the stale label if the label needs to be created.                                                |                       |
| [stale-pr-message](#stale-pr-message)                     | The message to post on the stale draft pull request that is being labeled.                                         |                       |

### List of output options

| Output       | Description                                   |
| ------------ | --------------------------------------------- |
| closed-prs   | List of all new closed draft pull requests.   |
| staled-prs   | List of all new staled draft pull requests.   |
| unstaled-prs | List of all new unstaled draft pull requests. |

### Usage

See also [action.yml](./action.yml) for a comprehensive list of all the options.

Basic:

```yaml
name: 'Stale draft PR handler'
on:
  workflow_dispatch:
  schedule:
    # Daily
    - cron: '0 0 * * *'

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: multitheftauto/stale-action@main
        with:
          close-pr-message: 'This draft pull request was closed because it has been marked stale for 30 days with no activity.'
          stale-pr-message: 'This draft pull request is stale because it has been open for at least 90 days with no activity. Please continue on your draft pull request or it will be closed in 30 days automatically.'
```

Configure stale timeouts:

```yaml
name: 'Stale draft PR handler'
on:
  workflow_dispatch:
  schedule:
    # Daily
    - cron: '0 0 * * *'

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: multitheftauto/stale-action@main
        with:
          close-pr-message: 'This draft pull request was closed because it has been marked stale for 5 days with no activity.'
          days-before-pr-close: 5
          days-before-pr-stale: 30
          stale-pr-message: 'This draft pull request is stale because it has been open for at least 30 days with no activity. Please continue on your draft pull request or it will be closed in 5 days automatically.'
```

Ignore a specific label from being processed:

```yaml
name: 'Stale draft PR handler'
on:
  workflow_dispatch:
  schedule:
    # Daily
    - cron: '0 0 * * *'

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: multitheftauto/stale-action@main
        with:
          ignored-label: 'keep'
```
