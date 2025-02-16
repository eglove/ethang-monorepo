-- Migration number: 0003 	 2025-02-16T21:17:42.315Z
CREATE TABLE applications_new
(
    id              TEXT NOT NULL,
    userEmail       TEXT NOT NULL,
    applied         TEXT NOT NULL,
    company         TEXT NOT NULL,
    title           TEXT NOT NULL,
    url             TEXT NOT NULL,
    rejected        TEXT,
    interviewRounds TEXT,
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

DROP TABLE applications;
ALTER TABLE applications_new
    RENAME TO applications;