-- Migration number: 0002 	 2025-05-16T22:55:22.542Z
pragma foreign_keys= off;

create table bookmarks_new
(
    id     text primary key not null,
    title  text             not null,
    url    text             not null,
    userId text             not null
);

insert into bookmarks_new (id, title, url, userId)
select id, title, url, userId
from bookmarks;

drop table bookmarks;

alter table bookmarks_new rename to bookmarks;

drop table users;

pragma foreign_keys=on;