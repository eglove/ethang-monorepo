-- Migration number: 0001 	 2025-01-28T21:59:00.192Z
create table Watcher
(
    id   text primary key,
    name text not null unique
);

create table Category
(
    id   text primary key,
    name text not null unique
);

create table RssFeed
(
    id          text primary key,
    title       text not null,
    url         text not null unique,
    description text
);

create table FeedWatcher
(
    feedId    text,
    watcherId text,
    primary key (feedId, watcherId),
    foreign key (feedId) references RssFeed (id),
    foreign key (watcherId) references Watcher (id)
);

create table FeedCategory
(
    feedId     text,
    categoryId text,
    primary key (feedId, categoryId),
    foreign key (feedId) references RssFeed (id),
    foreign key (categoryId) references Category (id)
);