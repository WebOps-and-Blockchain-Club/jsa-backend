var similarity = require("string-cosine-similarity");

interface JOB {
  job_id: string;
  job_skills: string;
}

interface props {
  userSkills: string;
  jobs: JOB[];
}

interface recommendation {
  job_id: string;
  similarity: number;
}

export const Recommendations = async ({ userSkills, jobs }: props) => {
  let recommendations: Array<recommendation> = [];
  await Promise.all(
    jobs.map(async (job) => {
      recommendations.push({
        job_id: job.job_id,
        similarity: await similarity(userSkills, job.job_skills),
      });
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
