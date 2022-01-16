import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import client from "./db/postgres";
const axios = require("axios")
const app = express();

// middleware

app.use(express.json());

// To get all jobs
// /jobs?location=&title=
app.get("/jobs",async (req,res)=>{
  try {
    const {location , title} = req.query;

    var jobsearch = await client.query("SELECT * FROM jobsearch WHERE title=$1 AND location=$2", [title,location]);
    
    if(jobsearch.rows.length !== 0){
      const jobs = await client.query("SELECT * FROM jobs WHERE jobsearch_id=$1" , [jobsearch.rows[0].id]);
      if(jobs.rows.length !== 0){
        res.json(jobs.rows);
      }
    }
    else{
      // fetch the data from flask api
      var config = {
        method: 'get',
        url: `http://localhost:5000/job-search?job_title=${title}&job_location=${location}`,
        headers: { }
      };
      
      await axios(config)
      .then(async(response : any) =>{
        res.json(response.data)

        //Add the jobsearch data to db
        await client.query("INSERT INTO jobsearch(title, location) VALUES($1, $2)",[title , location]);

        //Add the jobs and jobsearch data to db 
        jobsearch = await client.query("SELECT * FROM jobsearch WHERE title=$1 AND location=$2",[title,location]);
        const data = response.data;
        data.map(async(job : any) => {
          await client.query("INSERT INTO jobs(id, title , description ,description_html , desk , employer , link , salary, jobsearch_id) VALUES($1, $2 , $3, $4 , $5, $6, $7, $8 , $9)",[job.id , job.title , job.description , job.description_html , job.desk , job.employer , job.link , job.salary , jobsearch.rows[0].id]);
        })
      })
      .catch(function (error : any) {
        console.log(error);
      });
     
    }
   
  } catch (error) {
    console.log(error.message)
    res.end()
  }
})

// To get a job
app.get("/job/:id",async (req,res)=>{
  try {
    const {id} = req.params;
    const job = await client.query("SELECT * FROM jobs WHERE id=$1",[id])
    res.json(job.rows[0]);
  } catch (error) {
    console.log(error.message)
  }
})


client.connect().then(() => {
  console.log("Connected to database");
  app.listen(3000, () => console.log("Listening on port 3000!"));
});
