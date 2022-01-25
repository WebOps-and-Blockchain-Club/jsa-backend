import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import client from "./db/postgres";
import cors from "cors";

const { v4: uuidv4 } = require('uuid');
const axios = require("axios")
const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : true}));

interface input{
  job_title : string
  job_location : string
}

//Bot
const run_bot = async () =>{
  const {rows : inputs} = await client.query("SELECT DISTINCT job_title,job_location from input_bot")
  const {rowCount : total_req_count} = await client.query("SELECT * FROM input_bot");
  const fetch_input : Array<input> = [];
  await Promise.all(inputs.map(async(input) =>{
     let req_count = await client.query("SELECT COUNT(*) from input_bot WHERE job_title = $1 AND job_location = $2",[input.job_title,input.job_location])
      let percentage = 100*req_count.rows[0].count/ total_req_count;
     if(percentage >= 50){
      fetch_input.push(input)
     }
  }))
  await Promise.all(fetch_input.map(async(input) =>{
    console.log(input)
    var config = {
      method: 'get',
      url: `http://localhost:5000/job-search?job_title=${input.job_title}&job_location=${input.job_location}`,
      headers: { }
    }
    await axios(config)
    .then(async(response : any) =>{
     console.log(response)
    })
  })).catch(err => console.log(err))
}
setInterval(run_bot,86400000);

// To get all jobs
// /jobs?location=&title=
app.get("/jobs",async (req,res)=>{
  try {
    const {location , title} = req.query;
    await client.query("INSERT INTO input_bot(input_uid , job_title, job_location) VALUES($1, $2 , $3)",[ uuidv4() ,title , location]);

    var jobs:any ;
    if(location == undefined && title == undefined)  
    {
      res.json({"message": "Please provide title and location in query params"})
    }
    else if (title && location == undefined) {
      jobs = await client.query("SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_title=$1", [String(title).toLowerCase()]);
    }
    else if (title == undefined && location){
      jobs = await client.query("SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_location=$1" , [String(location).toLowerCase()]);
    }
    else{
      jobs = await client.query("SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_title=$1 AND jobinputs.job_location=$2" , [String(title).toLowerCase() , String(location).toLowerCase()]);
    }
    
    if(jobs.rows.length !== 0){
      res.json(jobs.rows);
    }
    else{
      // fetch the data from flask api
      res.end();
      var config = {
        method: 'get',
        url: `http://localhost:5000/job-search?job_title=${title}&job_location=${location}`,
        headers: { }
      };
      
      await axios(config)
      .then(async(response : any) =>{
        res.json(response.data)

        //Add the jobsearch data to db
        var jobinputs = await client.query("SELECT input_uid FROM jobinputs WHERE job_title=$1 AND job_location=$2",[title,location]);

        if(jobinputs.rows.length==0){
          await client.query("INSERT INTO jobinputs(input_uid , job_title, job_location) VALUES($1, $2 , $3)",[ uuidv4() ,title , location]);
          if(title && location){
            jobinputs = await client.query("SELECT input_uid FROM jobinputs WHERE job_title=$1 AND job_location=$2",[title,location]);
          }
          else if(title && location== undefined){
            jobinputs = await client.query("SELECT input_uid FROM jobinputs WHERE job_title=$1",[title]);
          }
          else{
            jobinputs = await client.query("SELECT input_uid FROM jobinputs WHERE job_location=$1",[location]);
          }
        }

        const data = response.data;
        data.map(async(job : any) => {
          jobs = await client.query("SELECT * FROM job_details WHERE job_id=$1",[job.id])
          if(jobs.rows.length==0){
            await client.query("INSERT INTO job_details(job_id, job_title , job_description ,job_description_html , job_desk , job_employer , job_link , job_salary) VALUES($1, $2 , $3, $4 , $5, $6, $7, $8 )",[job.id , job.title , job.description , job.description_html , job.desk , job.employer , job.link , job.salary] );
          }

          //Add the data to input_details (relation) table
          await client.query("INSERT INTO input_details(input_id, details_id) VALUES($1, $2)",[jobinputs.rows[0].input_uid , job.id]);
        })

        //Add data to relation table
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
    const jobs = await client.query("SELECT * FROM job_details WHERE job_id=$1",[id])
    res.json(jobs.rows[0]);
  } catch (error) {
    console.log(error.message)
  }
})


client.connect().then(() => {
  console.log("Connected to database");
  app.listen(3000, () => console.log("Listening on port 3000!"));
});
