CREATE TABLE applications_new
(
    id              TEXT NOT NULL,
    userEmail       TEXT NOT NULL,
    applied         TEXT NOT NULL,
    company         TEXT NOT NULL,
    title           TEXT NOT NULL,
    url             TEXT NOT NULL,
    rejected        TEXT NOT NULL,
    interviewRounds TEXT NOT NULL,
    PRIMARY KEY (id, userEmail)
);

CREATE TABLE questionAnswers_new
(
    id        TEXT NOT NULL,
    userEmail TEXT NOT NULL,
    answer    TEXT NOT NULL,
    question  TEXT NOT NULL,
    PRIMARY KEY (id, userEmail)
);

INSERT INTO applications_new
SELECT id,
       userEmail,
       applied,
       company,
       title,
       url,
       rejected,
       interviewRounds
FROM applications;

INSERT INTO questionAnswers_new
SELECT id, userEmail, answer, question
FROM questionAnswers;

DROP TABLE applications;
DROP TABLE questionAnswers;

ALTER TABLE applications_new
    RENAME TO applications;
ALTER TABLE questionAnswers_new
    RENAME TO questionAnswers;