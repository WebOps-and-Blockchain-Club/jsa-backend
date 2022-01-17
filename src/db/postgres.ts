import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
    user : process.env.PGUSER,
    password : process.env.PGPASSWORD,
    database : process.env.PGDATABASE,
    host : process.env.PGHOST,
    port : 5432

});



export default client;
