import { gql } from "@apollo/client";

import type { applicationsModel } from "../../generated/prisma/models/applications.ts";

export type FetchedApplication = Pick<
  applicationsModel,
  | "applied"
  | "company"
  | "dmSent"
  | "dmUrl"
  | "id"
  | "jobBoardUrl"
  | "rejected"
  | "title"
  | "url"
>;

export type GetAllApplications = {
  applications: {
    applications: FetchedApplication[];
    pagination: {
      limit: number;
      page: number;
      total: number;
      totalPages: number;
    };
  };
};

export const getAllApplications = gql`
  query GetApplications($page: Int, $limit: Int, $search: String) {
    applications(page: $page, limit: $limit, search: $search) {
      applications {
        id
        title
        company
        url
        jobBoardUrl
        applied
        rejected
        dmUrl
        dmSent
      }
      pagination {
        total
        page
        limit
        totalPages
      }
    }
  }
`;
