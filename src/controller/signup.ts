import client from "../db/postgres";
const { v4: uuidv4 } = require("uuid");

export async function signup(req: any, res: any) {
  try {
    const { displayName, email } = req.body;
    await client.query(
      "INSERT INTO user_table(id,username,email) VALUES($1, $2 , $3)",
      [uuidv4(), displayName, email]
    );
    res.json({ message: "Added User" });
  } catch (error) {
    res.json({ message: error.message });
    res.end();
  }
}
