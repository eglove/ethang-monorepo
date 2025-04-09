-- Migration number: 0004 	 2025-04-09T19:07:58.943Z
create table contacts (
    id text not null,
    userEmail text not null,
    name text not null,
    email text not null,
    linkedin text not null,
    latContact text not null,
    expectedNextContent text not null,
    primary key (id, userEmail)
);