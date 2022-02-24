import { FileFilterCallback } from "multer";

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
    _: Request,
    file: Express.Multer.File,
    callback: FileNameCallback
  ): void => {
    callback(null, Date.now() + "-" + file.originalname);
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
