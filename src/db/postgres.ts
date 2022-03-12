import { Client } from "pg";

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PASSWORD,
  port: Number(String(process.env.PGPORT)),
});

client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp" ;`, (err) => {
  if (err) {
    console.log(err.stack);
  }
});

client.query(
  "CREATE TABLE IF NOT EXISTS job_details( job_id VARCHAR(50) NOT NULL UNIQUE, job_title VARCHAR NOT NULL, job_location VARCHAR NOT NULL, job_desk VARCHAR(50) NOT NULL, job_employer VARCHAR NOT NULL, job_salary VARCHAR NOT NULL, job_link VARCHAR NOT NULL, job_description VARCHAR NOT NULL, job_description_html VARCHAR NOT NULL,job_skills VARCHAR, PRIMARY KEY (job_id));",
  (err) => {
    if (err) {
      console.log(err.stack);
    }
  }
);

client.query(
  "CREATE TABLE IF NOT EXISTS jobinputs( input_uid UUID NOT NULL PRIMARY KEY, title VARCHAR(50) , location VARCHAR(50) );",
  (err) => {
    if (err) {
      console.log(err.stack);
    }
  }
);

client.query(
  "CREATE TABLE IF NOT EXISTS input_details( input_id UUID REFERENCES jobinputs(input_uid) ON DELETE CASCADE ON UPDATE CASCADE, details_id VARCHAR(50) REFERENCES job_details(job_id) ON DELETE CASCADE ON UPDATE CASCADE);",
  (err) => {
    if (err) {
      console.log(err.stack);
    }
  }
);
client.query(
  "CREATE TABLE IF NOT EXISTS user_table( id UUID NOT NULL PRIMARY KEY, username VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL, resumestring VARCHAR(100),resumetext VARCHAR , experience VARCHAR ,skills VARCHAR ,age VARCHAR, gender VARCHAR,  UNIQUE(email) );",
  (err) => {
    if (err) {
      console.log(err.stack);
    }
  }
);

client.query(
  "CREATE TABLE IF NOT EXISTS input_bot(input_uid UUID NOT NULL PRIMARY KEY,job_title VARCHAR(50) NOT NULL,job_location VARCHAR(50) NOT NULL);",
  (err) => {
    if (err) {
      console.log(err.stack);
    }
  }
);

client.query(
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS input_bot_tl_idx ON input_bot(job_title , job_location);",
  (err) => {
    if (err) {
      console.log(err.stack);
    }
  }
);

export default client;
