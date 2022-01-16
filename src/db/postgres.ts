import { Client } from "pg";

const client = new Client();

client.query('SELECT NOW() as now', (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(res.rows[0])
    }
  })

client.query('CREATE TABLE IF NOT EXISTS jobsearch( id BIGSERIAL NOT NULL PRIMARY KEY, title VARCHAR(100), location VARCHAR(100));', (err) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log('Jobsearch Table created successfully')
      // console.log(res)
    }
  })

client.query('CREATE TABLE IF NOT EXISTS jobs(id VARCHAR ,title VARCHAR(100),description VARCHAR,description_html VARCHAR, desk VARCHAR(20), employer VARCHAR,link VARCHAR,salary VARCHAR,jobsearch_id BIGINT REFERENCES jobsearch(id));', (err) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log('Jobs Table created successfully')
      // console.log(res)
    }
  })
  

export default client;
