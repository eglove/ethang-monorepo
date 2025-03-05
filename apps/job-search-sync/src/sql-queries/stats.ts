import {
  averageApplicationsPerDay,
  userAverageApplicationsPerDay,
} from "./average-applications-per-day.js";
import {
  averageResponseRate,
  userAverageResponseRate,
} from "./average-response-rate.js";
import {
  averageTimeToInterview,
  userAverageTimeToInterview,
} from "./average-time-to-interview.js";
import {
  averageTimeToRejection,
  userAverageTimeToRejection,
} from "./average-time-to-rejection.js";
import {
  dailyApplications,
  userDailyApplications,
} from "./daily-applications.js";
import { topCompanies, userTopCompanies } from "./top-companies.js";
import {
  totalCompaniesApplications,
  userTotalCompaniesApplications,
} from "./total-companies-applications.js";

export const globalStatsQuery = `
    WITH topCompanies as (${topCompanies}),
         totals as (${totalCompaniesApplications}),
         averageResponseRate
             as (${averageResponseRate}),
         averageTimeToInterview
             as (${averageTimeToInterview}),
         averageTimeToRejection
             as (${averageTimeToRejection}),
         dailyApplications
             as (${dailyApplications}),
         averageApplicationsPerDay
             as (${averageApplicationsPerDay})
    SELECT (SELECT averageResponseRate
            FROM averageResponseRate)             as averageResponseRate,
           (SELECT averageTimeToInterview
            FROM averageTimeToInterview)          as averageTimeToInterview,
           (SELECT averageTimeToRejection
            FROM averageTimeToRejection)          AS averageTimeToRejection,
           (select totalCompanies from totals)    as totalCompanies,
           (select totalApplications from totals) as totalApplications,
           (select averageApplicationsPerDay
            from averageApplicationsPerDay)       as averageApplicationsPerDay,
           (select json_group_array(json_object(
                   'date', date,
                   'count',
                   totalApplications))
            from dailyApplications)               as applicationsPerDay,
           (SELECT json_group_array(json_object(
                   'company', company, 'count',
                   count))
            FROM topCompanies)                    AS topCompanies`;

export const userStatsQuery = `
    WITH topCompanies as (${userTopCompanies}),
         totals as (${userTotalCompaniesApplications}),
         averageResponseRate
             as (${userAverageResponseRate}),
         averageTimeToInterview
             as (${userAverageTimeToInterview}),
         averageTimeToRejection
             as (${userAverageTimeToRejection}),
         dailyApplications
             as (${userDailyApplications}),
         averageApplicationsPerDay
             as (${userAverageApplicationsPerDay})
    SELECT (SELECT averageResponseRate
            FROM averageResponseRate)             as averageResponseRate,
           (SELECT averageTimeToInterview
            FROM averageTimeToInterview)          as averageTimeToInterview,
           (SELECT averageTimeToRejection
            FROM averageTimeToRejection)          AS averageTimeToRejection,
           (select totalCompanies from totals)    as totalCompanies,
           (select totalApplications from totals) as totalApplications,
           (select averageApplicationsPerDay
            from averageApplicationsPerDay)       as averageApplicationsPerDay,
           (select json_group_array(json_object(
                   'date', date,
                   'count',
                   totalApplications))
            from dailyApplications)               as applicationsPerDay,
           (SELECT json_group_array(json_object(
                   'company', company, 'count',
                   count))
            FROM topCompanies)                    AS topCompanies`;
