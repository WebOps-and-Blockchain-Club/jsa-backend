import { NextFunction, Request, Response } from "express";
import client from "../db/postgres";
const { v4: uuidv4 } = require("uuid");
import jwt from "jsonwebtoken";
import { Recommendations } from "../utils/recommendationmodel";
import { fileFilter, fileStorage } from "../utils/multer";
import path from "path";
const axios = require("axios");
const multer = require("multer");
const config = require("../../config.json");
const fs = require("fs");
var reader = require("any-text");

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

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.cookies.jsaToken) {
    let token = req.cookies.jsaToken;
    if (!token) {
      return res
        .status(403)
        .json({ message: "Session Expired Please login again" })
        .end();
    }
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as any;
      req.currentUser = decoded.user;
    }
    return next();
  }
  return res.json({ message: "Please Login to continue" }).end();
};
export async function signup(req: any, res: any) {
  try {
    const { displayName, email } = req.body;

    if (!(email && displayName)) {
      return res
        .json({ message: "Some Error occured Please Try Again Later" })
        .end();
    }
    const { rows: user } = await client.query(
      "SELECT id,username,email,resumestring,skills FROM user_table WHERE email = $1",
      [email]
    );

    if (user.length > 0) {
      const token = jwt.sign({ user: user[0] }, process.env.JWT_SECRET!, {
        expiresIn: "2 days",
      });
      res.cookie("jsaToken", token, {httpOnly : true});
      return res.json({ message: "User logged in" }).end();
    }

    await client.query(
      "INSERT INTO user_table(id,username,email) VALUES($1, $2 , $3)",
      [uuidv4(), displayName, email]
    );
    const { rows: userM } = await client.query(
      "SELECT id,username,email,resumestring,skills FROM user_table WHERE email = $1",
      [email]
    );

    const token = jwt.sign({ user: userM[0] }, process.env.JWT_SECRET!, {
      expiresIn: "2 days",
    });
    res.cookie("jsaToken", token,{httpOnly : true});
    return res.json({ message: "Added User" }).end();
  } catch (error) {
    res.json({ message: error.message }).end();
  }
}

export async function signout(_: Request, res: Response) {
  return res
    .cookie("jsaToken", "", { httpOnly: true, maxAge: 1 })
    .json({ message: "Logged out Successfully" })
    .end();
}

export async function profile(req: Request, res: Response) {
  if (req.currentUser) {
    const {rows : userM} = await client.query("SELECT * FROM user_table WHERE email = $1",[req.currentUser.email])
    return res.json(userM[0]).end();
  }
}
export async function addprofile(req: Request, res: Response) {
  const { age, experience, gender } = req.body;

  try {
    await client.query(
      "UPDATE user_table SET age = $1 , gender = $2 , experience = $3 WHERE email = $4",
      [age, experience, gender, req.currentUser.email]
    );
  } catch (err) {
    return res.json({ message: err.message }).end();
  }
  return res.status(200).json({ message: "Profile Updated" });
}

export async function recommendations(req: Request, res: Response) {
  const { rows: userSkills } = await client.query(
    "SELECT skills FROM user_table where email = $1",
    [req.currentUser.email]
  );
  const { rows: jobs } = await client.query("SELECT * FROM job_details");
  const recommendations = await Recommendations({
    userSkills: userSkills[0].skills,
    jobs,
  });
  return res.json(recommendations).end();
}

export async function resumeupload(req: Request, res: Response) {
  var upload = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
    limits: { fileSize: config.max_filesize },
  }).single("file");
  const dirPublic = path.join(__dirname, `../../Resumes`);

  if (!fs.existsSync(dirPublic)) {
    fs.mkdirSync(dirPublic);
  }
  try {
    upload(req, res, async (err: Error) => {
      if (err instanceof multer.MulterError) {
        return res.status(500).json({ message: err.message }).end();
      } else if (err) {
        return res.json({ message: err.message }).end();
      } else if (req.fileUploadError) {
        return res.json({ message: req.fileUploadError }).end();
      }
      await reader
        .getText(`./Resumes/${req.currentUser.resumestring}`)
        .then(async function (data1: any) {
          var data = JSON.stringify({
            "text": data1
          });
          var config = {
            method: "post",
            url: `${process.env.FLASKAPI_URL}/get-skills`,
            headers: { 
              'Content-Type': 'application/json'
            },
            data,
          };
          // Send Resume to flask api
          await axios(config)
            .then(async (response: any) => {
              await client.query(
                "UPDATE user_table SET skills = $1,resumestring = $2,resumetext = $3  WHERE id = $4",
                [
                  response.data,
                  req.currentUser.resumestring,
                  data,
                  req.currentUser.id,
                ]
              );
            })
            .catch(function (error: Error) {
              return res.json({ message: error.message }).end();
            });
        });

      return res.status(200).json({ message: "File Uploaded Succesfully" });
    });
  } catch (err) {
    res.json({ message: err.message }).end();
  }
}
