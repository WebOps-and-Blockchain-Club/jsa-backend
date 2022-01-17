-- uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the database using this command
-- CREATE DATABASE jsa;

-- switch to the database jsa
-- \c jsa

-- type \i PATH/src/db/dataBase.sql

-- TABLE TO STORE job_location and job_title 
CREATE TABLE IF NOT EXISTS jobinputs(
    input_uid UUID NOT NULL PRIMARY KEY,
    job_title VARCHAR(50) NOT NULL,
    job_location VARCHAR(50) NOT NULL
);

-- TABLE TO STORE job details
CREATE TABLE IF NOT EXISTS job_details(
    job_id VARCHAR(50) NOT NULL UNIQUE,
    job_desk VARCHAR(50) NOT NULL,
    job_employer VARCHAR(100) NOT NULL,
    job_salary VARCHAR(20) NOT NULL,
    job_description VARCHAR(200) NOT NULL,
    job_description_html VARCHAR NOT NULL,
    PRIMARY KEY (job_id)

);

-- Many to Many relations table

-- TESTING
INSERT INTO jobinputs(input_uid,job_title , job_location) VALUES(uuid_generate_v4(),'Developer','Chennai');
INSERT INTO job_details(job_id, job_desk,job_employer , job_salary , job_description , job_description_html) VALUES('test','Times Jobs','test employer','22k','test des','test des html');
