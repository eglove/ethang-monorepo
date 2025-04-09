-- Migration number: 0005 	 2025-04-10T10:00:00.000Z
create table contacts_new
(
    id                  text not null,
    userEmail           text not null,
    name                text not null,
    email               text not null,
    linkedin            text not null,
    lastContact         text not null,
    expectedNextContact text not null,
    primary key (id, userEmail)
);

insert into contacts_new (id, userEmail, name, email, linkedin, lastContact,
                          expectedNextContact)
select id, userEmail, name, email, linkedin, latContact, expectedNextContent
from contacts;

drop table contacts;

alter table contacts_new
    rename to contacts;