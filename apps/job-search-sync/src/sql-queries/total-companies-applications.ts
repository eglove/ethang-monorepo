export const totalCompaniesApplications = `
    select count(distinct applications.company) as totalCompanies,
           count(*)                             as totalApplications
    from applications`;

export const userTotalCompaniesApplications = `
    select count(distinct applications.company) as totalCompanies,
           count(*)                             as totalApplications
    from applications
    where userEmail = ?`;
