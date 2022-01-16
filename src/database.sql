CREATE DATABASE jsa;

CREATE TABLE jobsearch( 
    id BIGSERIAL NOT NULL PRIMARY KEY,
    title VARCHAR(100),
    location VARCHAR(100)
    );

CREATE TABLE jobs(
    id VARCHAR ,
    title VARCHAR(100),
    description VARCHAR,
    description_html VARCHAR,
    desk VARCHAR(20),
    employer VARCHAR,
    link VARCHAR,
    salary VARCHAR,
    jobsearch_id BIGINT REFERENCES jobsearch(id)
);