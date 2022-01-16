CREATE DATABASE jsa;

CREATE TABLE jobsearch( 
    title VARCHAR(100),
    location VARCHAR(100)
    );

CREATE TABLE jobs(
    id VARCHAR SERIAL PRIMARY KEY,
    title VARCHAR(100),
    description VARCHAR,
    description_html VARCHAR,
    desk VARCHAR(20),
    employer VARCHAR,
    link VARCHAR,
    salary VARCHAR,
)