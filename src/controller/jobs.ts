import { Request, Response } from "express";
import { Recommendations } from "../utils/recommendationmodel";
import client from "../db/postgres";
import { verifyToken2 } from "../utils/auth";
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

interface User {
  id: string;
  username: string;
  email: string;
  resumestring?: string;
  skills?: string;
}
declare module "express-serve-static-core" {
  export interface Request {
    currentUser: User;
    fileUploadError?: string;
  }
}

export async function jobId(req: Request, res: Response) {
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
}

export async function jobs(req: Request, res: Response) {
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
      jobs = await client.query(
        "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_title=$1 AND jobinputs.job_location=$2",
        [String(title).toLowerCase(), String(location).toLowerCase()]
      );
    }

    if (jobs.rows.length !== 0) {
      verifyToken2(req, res)
        ? res.json(
            await Recommendations({
              userSkills: req.currentUser.skills!,
              jobs: jobs.rows,
            })
          )
        : res.json(jobs.rows);
    }
    // job title and job location combination is not present then it willl scrap the data from flask api
    else {
      // fetch the data from flask api
      var config = {
        method: "get",
        url: `${process.env.FLASK_URL}/job-search?job_title=${title}&job_location=${location}`,
        headers: {},
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
          try {
            if (jobinputs.rows.length == 0) {
              await client.query(
                "INSERT INTO jobinputs(input_uid , job_title, job_location) VALUES($1, $2 , $3)",
                [uuidv4(), title, location]
              );
              if (title && location) {
                jobinputs = await client.query(
                  "SELECT input_uid FROM jobinputs WHERE job_title=$1 AND job_location=$2",
                  [title, location]
                );
              } else if (title && location == undefined) {
                jobinputs = await client.query(
                  "SELECT input_uid FROM jobinputs WHERE job_title=$1",
                  [title]
                );
              } else {
                jobinputs = await client.query(
                  "SELECT input_uid FROM jobinputs WHERE job_location=$1",
                  [location]
                );
              }
            }
          } catch (error) {
            console.log(error.message);
            res.json({ message: "Error in storing the jobinputs" });
          }

          //insert jobs to the job details table
          const data = response.data;
          await Promise.all(
            data.data.map(async (job: any) => {
              jobs = await client.query(
                "SELECT * FROM job_details WHERE job_id=$1",
                [job.id]
              );
              if (jobs.rows.length == 0) {
                try {
                  await client.query(
                    "INSERT INTO job_details(job_id, job_title , job_description ,job_description_html , job_desk , job_employer , job_link , job_salary,job_skills) VALUES($1, $2 , $3, $4 , $5, $6, $7, $8, $9 )",
                    [
                      job.id,
                      job.title,
                      job.description,
                      job.description_html,
                      job.desk,
                      job.employer,
                      job.link,
                      job.salary,
                      job.skills,
                    ]
                  );
                } catch (error) {
                  console.log(error.message);
                }
              }

              //Add the relation between the job_details and jobinputs table in input details table
              try {
                await client.query(
                  "INSERT INTO input_details(details_id, input_id) VALUES($1, $2)",
                  [job.id, jobinputs.rows[0].input_uid]
                );
              } catch (err) {
                console.log(err.message);
                // res.json({
                //   message: "Error in inserting data to input_details table",
                // });
              }
            })
          );

          //get the jobs from db
          if (title && location == undefined) {
            jobs = await client.query(
              "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_title=$1",
              [String(title).toLowerCase()]
            );
            verifyToken2(req, res)
              ? res.json(
                  Recommendations({
                    userSkills: req.currentUser.skills!,
                    jobs: jobs.rows,
                  })
                )
              : res.json(jobs.rows);
          } else if (title == undefined && location) {
            jobs = await client.query(
              "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_location=$1",
              [String(location).toLowerCase()]
            );
            verifyToken2(req, res)
              ? res.json(
                  Recommendations({
                    userSkills: req.currentUser.skills!,
                    jobs: jobs.rows,
                  })
                )
              : res.json(jobs.rows);
          } else {
            jobs = await client.query(
              "SELECT * FROM job_details INNER JOIN input_details ON job_details.job_id=input_details.details_id INNER JOIN jobinputs ON input_details.input_id=jobinputs.input_uid WHERE jobinputs.job_title=$1 AND jobinputs.job_location=$2",
              [String(title).toLowerCase(), String(location).toLowerCase()]
            );
            verifyToken2(req, res)
              ? res.json(
                  Recommendations({
                    userSkills: req.currentUser.skills!,
                    jobs: jobs.rows,
                  })
                )
              : res.json(jobs.rows);
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
}
