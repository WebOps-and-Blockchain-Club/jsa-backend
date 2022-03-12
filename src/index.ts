import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import client from "./db/postgres";
import {
  addprofile,
  profile,
  recommendations,
  resumeupload,
  signout,
  signup,
  verifyToken,
} from "./controller/user";
import { jobId, jobs } from "./controller/jobs";
import { run_bot } from "./utils/bot";
import { NodeMailer } from "./controller/NodeMailer";

const nmobj = new NodeMailer();
const cors = require("cors");
var cookieParser = require("cookie-parser");
const config = require("../config.json");
const app = express();
var bodyParser = require("body-parser");

// middleware
app.use(cors(
  {
    origin : ["http://localhost:3000","http://18.191.187.251:5000/"],
    credentials : true
  }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//Bot
setInterval(run_bot, config.bot_interval);

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

// Add profile
app.post("/addprofile", verifyToken, addprofile);

// Job Recommendations
app.get("/recommendations", verifyToken, recommendations);

// Resume Upload
app.post("/upload", verifyToken, resumeupload);

app.get("/", (req, res) => {
  res.send("Listning on Port: " + process.env.PORT);
  console.log(req.params);
});
// Nodemailer
app.post('/nodemail',nmobj.nodemailer);

//TODO change log messages
//connect to the database
client.connect().then(() => {
  console.log("Connected to database");
  app.listen(process.env.PORT, () =>
    console.log("Listening on port " + process.env.PORT)
  );
});
