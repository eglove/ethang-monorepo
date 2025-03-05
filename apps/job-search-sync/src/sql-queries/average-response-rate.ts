export const averageResponseRate = `
    select avg(case
                   when
                       (interviewRounds is not null and
                        json_valid(interviewRounds) =
                        1 and
                        json_array_length(interviewRounds) >
                        0) or
                       applications.rejected is not null
                       then 1
                   else 0 end) as averageResponseRate
    from applications`;

export const userAverageResponseRate = `
    select avg(case
                   when
                       (interviewRounds is not null and
                        json_valid(interviewRounds) =
                        1 and
                        json_array_length(interviewRounds) >
                        0) or
                       applications.rejected is not null
                       then 1
                   else 0 end) as averageResponseRate
    from applications where userEmail = ?`;
