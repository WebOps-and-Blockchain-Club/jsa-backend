import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import client from "./db/postgres";

const app = express();

client.connect().then(() => {
  console.log("Connected to database");
  app.listen(3000, () => console.log("Listening on port 3000!"));
});
