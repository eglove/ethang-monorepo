export const averageTimeToRejection = `
    SELECT AVG(julianday(rejected) - julianday(applied)) AS averageTimeToRejection
    FROM applications
    WHERE rejected IS NOT NULL
      AND applied IS NOT NULL`;

export const userAverageTimeToRejection = `
    SELECT AVG(julianday(rejected) - julianday(applied)) AS averageTimeToRejection
    FROM applications
    WHERE rejected IS NOT NULL
      AND applied IS NOT NULL
      and userEmail = ?`;
