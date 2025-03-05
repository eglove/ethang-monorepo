export const averageTimeToInterview = `
    SELECT AVG(
                   julianday(json_extract(interviewRounds, '$[0]')) -
                   julianday(applied)
           ) AS averageTimeToInterview
    FROM applications
    WHERE interviewRounds IS NOT NULL
      AND json_valid(interviewRounds) = 1
      AND json_array_length(interviewRounds) > 0`;

export const userAverageTimeToInterview = `
    SELECT AVG(
                   julianday(json_extract(interviewRounds, '$[0]')) -
                   julianday(applied)
           ) AS averageTimeToInterview
    FROM applications
    WHERE interviewRounds IS NOT NULL
      and userEmail = ?
      AND json_valid(interviewRounds) = 1
      AND json_array_length(interviewRounds) > 0`;
