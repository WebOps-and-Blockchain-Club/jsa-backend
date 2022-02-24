import express, { NextFunction, Request, Response } from "express";
import * as dotenv from "dotenv";
dotenv.config();
import client from "./db/postgres";
import { fileFilter, fileStorage } from "./utils/multer";
import { Recommendations } from "./utils/recommendationmodel";
import jwt from "jsonwebtoken";


const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const cors = require("cors");
const app = express();
const config = require("../config.json");
const multer = require("multer");
const fs = require("fs");
var bodyParser = require("body-parser");

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

interface input {
  job_title: string;
  job_location: string;
}

//Bot
const run_bot = async () => {
  const { rows: inputs } = await client.query(
    "SELECT DISTINCT job_title,job_location from input_bot"
  );
  const { rowCount: total_req_count } = await client.query(
    "SELECT * FROM input_bot"
  );
  let fetch_input: Array<input> = [];
  await Promise.all(
    inputs.map(async (input) => {
      let req_count = await client.query(
        "SELECT COUNT(*) from input_bot WHERE job_title = $1 AND job_location = $2",
        [input.job_title, input.job_location]
      );
      let percentage = (100 * req_count.rows[0].count) / total_req_count;
      if (percentage >= config.bot_percentage) {
        fetch_input.push(input);
      }
    })
  );
  await Promise.all(
    fetch_input.map(async (input) => {
      console.log(input);
      var config = {
        method: "get",
        url: `${process.env.FLASKAPI_URL}/job-search?job_title=${input.job_title}&job_location=${input.job_location}`,
        headers: {},
      };
      await axios(config).then(async (response: any) => {
        console.log(response);
      });
    })
  ).catch((err) => console.log(err));
};
setInterval(run_bot, config.bot_interval);

// To get all jobs with query params
app.get("/jobs", async (req, res) => {
  try {
    const { location, title } = req.query;

    var jobs: any;

    //check whether entered title and location is present in jobinputs table

    //location and title is not specified
    if (location == undefined && title == undefined) {
      res.json({
        message: "Please provide title and location in query params",
      });
    } else if (title && location == undefined) {
      jobs = await client.query(
        "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_title=$1",
        [String(title).toLowerCase()]
      );
    } else if (title == undefined && location) {
      jobs = await client.query(
        "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_location=$1",
        [String(location).toLowerCase()]
      );
    } else {
      await client.query(
        "INSERT INTO input_bot(input_uid , job_title, job_location) VALUES($1, $2 , $3)",
        [uuidv4(), title, location]
      );
      jobs = await client.query(
        "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_title=$1 AND jobinputs.job_location=$2",
        [String(title).toLowerCase(), String(location).toLowerCase()]
      );
    }

    console.log(String(title).toLowerCase(), String(location).toLowerCase());
    if (jobs.rows.length !== 0) {
      res.json(jobs.rows);
    }
    // job title and job location combination is not present then it willl scrap the data from flask api
    else {
      // fetch the data from flask api
      var config = {
        method: "get",
        url: `${process.env.FLASKAPI_URL}/job-search?job_title=${title}&job_location=${location}`,
      };

      await axios(config)
        .then(async (response: any) => {
          // res.json(response.data);             will return the jobs directly from flask api

          //first we will store the jobs

          //check whether jobinputs is present or not in data base
          var jobinputs = await client.query(
            "SELECT input_uid FROM jobinputs WHERE job_title=$1 AND job_location=$2",
            [title, location]
          );

          //Add the jobinputs data to db if it is not present
          if (jobinputs.rows.length == 0) {
            await client.query(
              "INSERT INTO jobinputs(input_uid , job_title, job_location) VALUES($1, $2 , $3)",
              [
                uuidv4(),
                String(title).toLowerCase(),
                String(location).toLowerCase(),
              ]
            );
            if (title && location) {
              jobinputs = await client.query(
                "SELECT input_uid FROM jobinputs WHERE job_title=$1 AND job_location=$2",
                [String(title).toLowerCase(), String(location).toLowerCase()]
              );
            } else if (title && location == undefined) {
              jobinputs = await client.query(
                "SELECT input_uid FROM jobinputs WHERE job_title=$1",
                [String(title).toLowerCase()]
              );
            } else {
              jobinputs = await client.query(
                "SELECT input_uid FROM jobinputs WHERE job_location=$1",
                [String(location).toLowerCase()]
              );
            }
          }

          //insert jobs to the job details table
          const data = response.data;
          await Promise.all(
            data.map(async (job: any) => {
              jobs = await client.query(
                "SELECT * FROM job_details WHERE job_id=$1",
                [job.id]
              );
              if (jobs.rows.length == 0) {
                await client.query(
                  "INSERT INTO job_details(job_id, job_title , job_description ,job_description_html , job_desk , job_employer , job_link , job_salary) VALUES($1, $2 , $3, $4 , $5, $6, $7, $8 )",
                  [
                    job.id,
                    job.title,
                    job.description,
                    job.description_html,
                    job.desk,
                    job.employer,
                    job.link,
                    job.salary,
                  ]
                );
              }

              //Add the relation between the job_details and jobinputs table in input details table
              await client.query(
                "INSERT INTO input_details(input_id, details_id) VALUES($1, $2)",
                [jobinputs.rows[0].input_uid, job.id]
              );
            })
          );

          //get the jobs from db
          if (title && location == undefined) {
            jobs = await client.query(
              "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_title=$1",
              [String(title).toLowerCase()]
            );
            res.json(jobs.rows);
          } else if (title == undefined && location) {
            jobs = await client.query(
              "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_location=$1",
              [String(location).toLowerCase()]
            );
            res.json(jobs.rows);
          } else {
            jobs = await client.query(
              "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_title=$1 AND jobinputs.job_location=$2",
              [String(title).toLowerCase(), String(location).toLowerCase()]
            );
            res.json(jobs.rows);
          }
        })
        .catch(function (error: any) {
          console.log(error);
        });
    }
  } catch (error) {
    console.log(error.message);
    res.end();
  }
});

// To get a job details
app.get("/job/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id == undefined) {
      res.json({ message: "Please provide job id in path params" });
    } else {
      const jobs = await client.query(
        "SELECT * FROM job_details WHERE job_id=$1",
        [id]
      );
      res.json(jobs.rows[0]);
    }
  } catch (error) {
    console.log(error.message);
  }
});
const verifyToken = (req : Request, res : Response, next : NextFunction) => {
  if(req.headers.cookie) {
    let token = req.headers.cookie.split("token=")[1];
    console.log(token)
    if (!token) {
      return res.status(403).json({message : "Session Expired Please login again"}).end();
    }
    if(token){
      token.split(";").length > 1 ? token = token.split(";")[0] : null
    }
    if(token){
      const decoded = jwt.verify(token, process.env.JWT_SECRET ||  "secret" ) as any;
      console.log("decoded",decoded)
    }
    return next();
  }
  return res.json({message : "Please Login to continue"}).end();
};

app.post("/signup", async (req, res) => {
  try {
    const { displayName, email } = req.body;

    if (!(email && displayName)) {
      return res.json({ message: "Some Error occured Please Try Again Later" }).end();
    }
    const userM = await client.query("SELECT * FROM usertable WHERE email = $1",[email])

    if(userM.rowCount > 0){
       const token = jwt.sign(
        { user: userM },
        process.env.JWT_SECRET!,
        {
          expiresIn: "2 days",
        }
      );
     return  res.cookie("token", token ).end();
    }
  
    await client.query(
      "INSERT INTO usertable(id,username,email) VALUES($1, $2 , $3)",
      [uuidv4(), displayName, email]
    );

    const token = jwt.sign(
      { user: userM },
      process.env.JWT_SECRET!,
      {
        expiresIn: "2 days",
      }
    );
    res.cookie("token", token )
   return  res.json({ message: "Added User" }).end();
  } catch (error) {
    res.json({ message: error.message });
    res.end();
  }
});

app.post("/signout", async (_, res) => {

  return res.cookie("token", "", { httpOnly: true, maxAge: 1 }).end();

});

// Resume Upload
var upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  // limits: { fileSize: config.max_filesize },
}).single('file');

app.post("/upload", async (req, res) => {
  upload(req, res, async (err: Error) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err).end();
    } else if (err) {
      return res.json(err).end();
    }
    var data = fs.readFileSync(`./Resumes/${req.file?.filename}`);
    var config = {
      method: "post",
      url: `${process.env.FLASKAPI_URL}/resume`,
      data: data,
    };

    // Send Resume to flask api
    await axios(config)
      .then(async (response: any) => {
        await client.query(
          "INSERT INTO usertable(skills,resumestring) VALUES($1,$2) WHERE email = $3",
          [response.data, `./Resumes/${req.file?.filename}`]
        );
      })
      .catch(function (error: Error) {
        console.log(error);
      });
    return res.status(200).json({ message: "File Uploaded Succesfully" });
  });
});

app.get("/recommendations",verifyToken, async (_, res) => {
  // const {email} = req.params;

  // const userSkills = await client.query("SELECT skills from use ")

  //Test
  const recommendations = await Recommendations({
    userSkills: "Test skill1 skill2",
    jobs: [
      { jobid: "job1", jobskills: "test skill1" },
      { jobid: "job1", jobskills: "test" },
      { jobid: "job1", jobskills: "test skill3 skill1 skill2" },
    ],
  });
  res.json(recommendations);
});

app.get("/", (req, res) => {
  res.send("Listning on Port: " + process.env.PORT);
  console.log(req.params);
});

//TODO change log messages
//connect to the database
client.connect().then(() => {
  console.log("Connected to database");
  app.listen(process.env.PORT, () =>
    console.log("Listening on port " + process.env.PORT)
  );
});
