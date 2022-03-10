var similarity = require("string-cosine-similarity");

interface JOB {
  job_id: string;
  job_skills: string;
  job_title: string;
  job_desk: string;
  job_employer: string;
  job_salary: string;
  job_link: string;
  job_description: string;
  job_description_html: string;
}

interface props {
  userSkills: string;
  jobs: JOB[];
}

interface recommendation {
  job_id: string;
  job_skills: string;
  job_title: string;
  job_desk: string;
  job_employer: string;
  job_salary: string;
  job_link: string;
  job_description: string;
  job_description_html: string;
  similarity: number;
}

export const Recommendations = async ({ userSkills, jobs }: props) => {
  let recommendations: Array<recommendation> = [];
  await Promise.all(
    jobs.map(async (job) => {
      if (job.job_skills) {
        recommendations.push({
          ...job,
          similarity: (await similarity(userSkills, job.job_skills)) * 100,
        });
      }
    })
  );

  recommendations.sort((a, b) => {
    if (a.similarity > b.similarity) {
      return -1;
    }
    if (a.similarity < b.similarity) {
      return 1;
    }
    return 0;
  });
  return recommendations;
};
