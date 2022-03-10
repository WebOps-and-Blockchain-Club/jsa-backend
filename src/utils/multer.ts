import { FileFilterCallback } from "multer";
import { Request } from "express";

var multer = require("multer");
var path = require("path");
type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

interface User {
  id: string;
  username: string;
  email: string;
  resumestring?: string;
  skills?: string;
}
declare module "express-serve-static-core" {
  export interface Request {
    currentUser: User,
    fileUploadError?: string;
  }
}

export const fileStorage = multer.diskStorage({
  destination: (
    _: Request,
    __: Express.Multer.File,
    callback: DestinationCallback
  ): void => {
    callback(null, "./Resumes");
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: FileNameCallback
  ): void => {
    const time = Date.now();
    req.currentUser.resumestring = `${
      req.currentUser.id
    }_${time}.${path.extname(file.originalname)}`;
    callback(
      null,
      `${req.currentUser.id}_${time}.${path.extname(file.originalname)}`
    );
  },
});

export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    callback(null, true);
  } else {
    req.fileUploadError = "File Type is Not Supported";
    callback(null, false);
  }
};
