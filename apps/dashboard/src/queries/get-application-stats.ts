import { gql } from "@apollo/client";

export type GetApplicationStats = {
  applicationStats: {
    averageApplicationsPerDay: number;
    averageResponseRate: number;
    averageTimeToRejected: number;
    topCompanies: {
      _count: {
        id: number;
      };
      company: string;
    }[];
    totalApplications: number;
    totalCompanies: number;
    userDailyApplications: {
      date: string;
      totalApplications: number;
    };
  };
};

export const getApplicationStats = gql`
  query GetApplicationStats {
    applicationStats {
      averageApplicationsPerDay
      averageResponseRate
      averageTimeToRejected
      topCompanies {
        _count {
          id
        }
        company
      }
      totalApplications
      totalCompanies
      userDailyApplications {
        date
        totalApplications
      }
    }
  }
`;
