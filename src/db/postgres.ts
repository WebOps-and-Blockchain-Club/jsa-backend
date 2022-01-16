import { Client } from "pg";
const values = ['Data scientist', 'jaipur']

const client = new Client();

client.query('SELECT NOW() as now', (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(res.rows[0])
    }
  })
  
  
client.query('INSERT INTO jobsearch(title, location) VALUES($1, $2) RETURNING *',values , (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log(res.rows[0])
    }
  })
  

export default client;
