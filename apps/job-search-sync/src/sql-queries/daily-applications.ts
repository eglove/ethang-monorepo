export const dailyApplications = `
    select date(applications.applied) as date,
           count(*)                   as totalApplications
    from applications
    where applied >= date('now', '-30 days')
    group by date(applied)
    order by date(applied)`;

export const userDailyApplications = `
    select date(applications.applied) as date,
           count(*)                   as totalApplications
    from applications
    where applied >= date('now', '-30 days')
    and userEmail = ?
    group by date(applied)
    order by date(applied)`;
