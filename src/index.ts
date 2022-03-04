import express from "express";

import * as dotenv from "dotenv";
dotenv.config();
import client from "./db/postgres";
import { profile, recommendations, signout, signup, verifyToken } from "./controller/user";
import { jobId, jobs } from "./controller/jobs";

const cors = require("cors");
var cookieParser = require("cookie-parser");
const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// To get all jobs with query params
app.get("/jobs", jobs);

// To get a job details
app.get("/job/:id", jobId);

// User login/signup
app.post("/signup", signup);

// User signout
app.post("/signout", verifyToken, signout);

// User Profile
app.get("/profile", verifyToken, profile);

// Job Recommendations
app.get("/recommendations", verifyToken, recommendations);

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
