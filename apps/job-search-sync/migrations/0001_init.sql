create table applications (
    id text primary key,
    applied text not null,
    company text not null,
    title text not null,
    url text not null,
    rejected text not null,
    interviewRounds text not null,
    userEmail text not null
);

create table questionAnswers (
    id text primary key,
    answer text not null,
    question text not null,
    userEmail text not null
);