export const averageApplicationsPerDay = `
    select CAST(sum(totalApplications) AS FLOAT) /
           CAST(count(*) AS FLOAT) as averageApplicationsPerDay
    from (
             select date(applications.applied) as applied_date,
                    count(*) as totalApplications
             from applications
             where applied >= date('now', '-30 days')
             group by date(applications.applied)
         )`;

export const userAverageApplicationsPerDay = `
    select CAST(sum(totalApplications) AS FLOAT) /
           CAST(count(*) AS FLOAT) as averageApplicationsPerDay
    from (
             select date(applications.applied) as applied_date,
                    count(*) as totalApplications
             from applications
             where applied >= date('now', '-30 days')
               and userEmail = ?
             group by date(applications.applied)
         )
`;
