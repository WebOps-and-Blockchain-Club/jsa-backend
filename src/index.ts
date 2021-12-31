import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import client from "./db/postgres";
import cors from "cors"

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// To get all jobs
// /jobs?location=&title=
app.get("/jobs",async (req,res)=>{
  try {
    const {location , title} = req.query;
    const jobs = await client.query("",[location,title]);
    if(jobs.rows.length !== 0){
      res.json(jobs.rows);
    }else{
      // fetch the data from flask api
     
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
    const job = await client.query("",[id])
    res.json(job.rows[0]);
  } catch (error) {
    console.log(error.message)
  }
})


client.connect().then(() => {
  console.log("Connected to database");
  app.listen(3000, () => console.log("Listening on port 3000!"));
});
