export const averageApplicationsPerDay = `
    select sum(totalApplications) / 30.0 as averageApplicationsPerDay
    from (select count(*) as totalApplications
          from applications
          where applied >= date('now', '-30 days')
          group by date(applications.applied))`;

export const userAverageApplicationsPerDay = `
    select sum(totalApplications) / 30.0 as averageApplicationsPerDay
    from (select count(*) as totalApplications
          from applications
          where applied >= date('now', '-30 days') and userEmail = ?
          group by date(applications.applied))`;
