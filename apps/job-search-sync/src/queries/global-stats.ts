export const globalStatsQuery = `WITH topCompanies AS (SELECT company,
                                                              COUNT(*) AS count
                                                       FROM applications
                                                       GROUP BY company
                                                       ORDER BY count DESC
                                                       LIMIT 5),
                                      totals
                                          as (select count(distinct applications.company) as totalCompanies,
                                                     count(*)                             as totalApplications
                                              from applications),
                                      averageResponseRate AS (SELECT AVG(case
                                                                             WHEN
                                                                                 applications.interviewRounds IS NOT NULL
                                                                                     AND
                                                                                 applications.interviewRounds !=
                                                                                 '[]'
                                                                                     AND
                                                                                 applications.rejected IS NOT NULL
                                                                                 THEN 1
                                                                             ELSE 0
                                          END) AS averageResponseRate
                                                              FROM applications),
                                      averageTimeToInterview AS (SELECT AVG(
                                                                                julianday(json_extract(interviewRounds, '$[0]')) -
                                                                                julianday(applied)
                                                                        ) AS averageTimeToInterview
                                                                 FROM applications
                                                                 WHERE interviewRounds IS NOT NULL
                                                                   AND json_valid(interviewRounds) = 1
                                                                   AND json_array_length(interviewRounds) > 0),
                                      averageTimeToRejection
                                          AS (SELECT AVG(julianday(rejected) - julianday(applied)) AS averageTimeToRejection
                                              FROM applications
                                              WHERE rejected IS NOT NULL
                                                AND applied IS NOT NULL),
                                      dailyApplications
                                          as (select date(applications.applied) as date,
                                                     count(*)                   as totalApplications
                                              from applications
                                              where applied >= date('now', '-30 days')
                                              group by date(applied)
                                              order by date(applied))
                                 SELECT (SELECT json_group_array(json_object(
                                         'company', company, 'count', count))
                                         FROM topCompanies)                    AS topCompanies,
                                        (SELECT averageResponseRate
                                         FROM averageResponseRate)             AS averageResponseRate,
                                        (SELECT averageTimeToInterview
                                         FROM averageTimeToInterview)          AS averageTimeToInterview,
                                        (SELECT averageTimeToRejection
                                         FROM averageTimeToRejection)          AS averageTimeToRejection,
                                        (select totalCompanies from totals)    as totalCompanies,
                                        (select totalApplications from totals) as totalApplications,
                                        (select json_group_array(json_object(
                                                'date', date,
                                                'count',
                                                totalApplications))
                                         from dailyApplications)               as applicationsPerDay`;
