export const topCompanies = `
    SELECT company,
           COUNT(*) AS count
    FROM applications
    GROUP BY company
    ORDER BY count DESC
    LIMIT 5`;

export const userTopCompanies = `
    SELECT company,
           COUNT(*) AS count
    FROM applications
    where userEmail = ?
    GROUP BY company
    ORDER BY count DESC
    LIMIT 5`;
