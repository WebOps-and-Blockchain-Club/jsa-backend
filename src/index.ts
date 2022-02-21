import express from "express";

import * as dotenv from "dotenv";
dotenv.config();
import client from "./db/postgres";
import { signup } from "./controller/signup";
import { jobId, jobs } from "./controller/jobs";

const cors = require("cors");
const app = express();

// middleware
app.use(cors());
app.use(express.json());

// To get all jobs with query params
app.get("/jobs", jobs);

// To get a job details
app.get("/job/:id", jobId);

// To get a job details
app.post("/signup", signup);

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
