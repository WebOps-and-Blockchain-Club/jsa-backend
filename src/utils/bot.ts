import client from "../db/postgres";
const axios = require("axios");
const config = require("../../config.json");

interface input {
  job_title: string;
  job_location: string;
}

export const run_bot = async () => {
  const { rows: inputs } = await client.query(
    "SELECT DISTINCT job_title,job_location from input_bot"
  );
  const { rowCount: total_req_count } = await client.query(
    "SELECT * FROM input_bot"
  );
  let fetch_input: Array<input> = [];
  await Promise.all(
    inputs.map(async (input) => {
      let req_count = await client.query(
        "SELECT COUNT(*) from input_bot WHERE job_title = $1 AND job_location = $2",
        [input.job_title, input.job_location]
      );
      let percentage = (100 * req_count.rows[0].count) / total_req_count;
      if (percentage >= config.bot_percentage) {
        fetch_input.push(input);
      }
    })
  );
  await Promise.all(
    fetch_input.map(async (input) => {
      console.log(input);
      var config = {
        method: "get",
        url: `${process.env.FLASKAPI_URL}/job-search?job_title=${input.job_title}&job_location=${input.job_location}`,
        headers: {},
      };
      await axios(config).then(async (response: any) => {
        const data = response;

        await Promise.all(
          data.map(async (job: any) => {
            //Get the inputs id
            const { rows: input_id } = await client.query(
              "SELECT input_uid FROM job_inputs WHERE job_title = $1 AND job_location = $2",
              [input.job_title, input.job_location]
            );
            // Insert jobs into job details table
            await client.query(
              "INSERT INTO job_details(job_id, job_title , job_description ,job_description_html , job_desk , job_employer , job_link , job_salary,job_skills) VALUES($1, $2 , $3, $4 , $5, $6, $7, $8 , $9 )",
              [
                job.id,
                job.title,
                job.description,
                job.description_html,
                job.desk,
                job.employer,
                job.link,
                job.salary,
                job.skills
              ]
            );
            // Insert into many to many relation table
            await client.query(
              " INSERT INTO input_details(input_id,details_id) VALUES($1,$2)",
              [input_id, job.id]
            );
          })
        );
      });
    })
  ).catch((err) => console.log(err));
};
