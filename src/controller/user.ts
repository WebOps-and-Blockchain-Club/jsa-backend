import { NextFunction, Request, Response } from "express";
import client from "../db/postgres";
const { v4: uuidv4 } = require("uuid");
import jwt from "jsonwebtoken";
import { Recommendations } from "../utils/recommendationmodel";

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
      "SELECT * FROM user_table WHERE email = $1",
      [email]
    );

    if (user.length > 0) {
      const token = jwt.sign({ user: user[0] }, process.env.JWT_SECRET!, {
        expiresIn: "2 days",
      });
      res.cookie("jsaToken", token);
      return res.json({ message: "User logged in" }).end();
    }

    await client.query(
      "INSERT INTO user_table(id,username,email) VALUES($1, $2 , $3)",
      [uuidv4(), displayName, email]
    );
    const { rows: userM } = await client.query(
      "SELECT * FROM user_table WHERE email = $1",
      [email]
    );

    const token = jwt.sign({ user: userM[0] }, process.env.JWT_SECRET!, {
      expiresIn: "2 days",
    });
    res.cookie("jsaToken", token);
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
    return res.json(req.currentUser).end();
  }
}

export async function recommendations(req: Request, res: Response) {
  const { rows: userSkills } = await client.query(
    "SELECT skills FROM user_table where email = $1",
    [req.currentUser.email]
  );
  const { rows: jobs } = await client.query(
    "SELECT job_id , job_skills FROM job_details"
  );
  const recommendations = await Recommendations({
    userSkills: userSkills[0].skills,
    jobs,
  });
  return res.json(recommendations).end();
}