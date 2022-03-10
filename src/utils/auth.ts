import { Request, Response } from "express";
import jwt from "jsonwebtoken";

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
export const verifyToken2 = (req: Request, _: Response) => {
  if (req.cookies.jsaToken) {
    let token = req.cookies.jsaToken;
    if (!token) {
      return false;
    }
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as any;
      req.currentUser = decoded.user;
      if (!req.currentUser.skills) return false;
    }
    return true;
  }
  return false;
};
