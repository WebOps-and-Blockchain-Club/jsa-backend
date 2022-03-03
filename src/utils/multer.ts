import { FileFilterCallback } from "multer";
import { Request } from "express";

var multer = require("multer");

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

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
    const filetype = file.mimetype.split("/").slice(-1)[0];
    req.currentUser.resumestring = `${req.currentUser.id}_${time}.${filetype}`;
    callback(null, `${req.currentUser.id}_${time}.${filetype}`);
  },
});

export const fileFilter = (
  _: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "application/pdf"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};
