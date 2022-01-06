/**
 * A Node ID.
 */
export type NodeID = string;

/**
 * A GitHub pull request.
 */
export type PullRequest = {
  id: NodeID;
  number: number;
  updatedAt: DateTime;
};

/**
 * A GitHub label.
 */
export type Label = {
  id: NodeID;
  name: string;
};

/**
 * A GitHub repository.
 */
export type Repository = {
  id: NodeID;
};

/**
 * GitHub GraphQL scalar type.
 * An ISO-8601 encoded UTC date string.
 * @see https://docs.github.com/en/graphql/reference/scalars#datetime
 */
export type DateTime = string;

/**
 * GitHub GraphQL query result item type.
 * A label.
 * @see https://docs.github.com/en/graphql/reference/objects#label
 */
export type LabelObject = Label & {};

/**
 * GitHub GraphQL query result item type.
 * A pull request.
 * @see https://docs.github.com/en/graphql/reference/objects#pullrequest
 */
export type PullRequestObject = PullRequest & {
  labels: {
    nodes?: LabelObject[];
  };
};

/**
 * GitHub GraphQL query result item type.
 * A repository.
 * @see https://docs.github.com/en/graphql/reference/objects#repository
 */
export type RepositoryWithLabel = Repository & {
  label: LabelObject;
};

export type RepositoryQuery = {
  repository: RepositoryWithLabel;
};

export type CreateLabelMutation = {
  createLabel: {
    label?: Label;
  };
};

export type PullRequestsQuery = {
  search: {
    issueCount: number;
    nodes?: PullRequestObject[];
    pageInfo: {
      endCursor?: string;
      hasNextPage: boolean;
    };
  };
};
