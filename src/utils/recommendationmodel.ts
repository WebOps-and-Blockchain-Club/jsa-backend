var similarity = require("string-cosine-similarity");

interface JOB {
  jobid: string;
  jobskills: string;
}

interface props {
  userSkills: string;
  jobs: JOB[];
}

interface recommendation {
  jobid: string;
  similarity: number;
}

export const Recommendations = async ({ userSkills, jobs }: props) => {
  let recommendations: Array<recommendation> = [];
  await Promise.all(
    jobs.map((job) => {
      recommendations.push({
        jobid: job.jobid,
        similarity: similarity(userSkills, job.jobskills)
      });
    })
  );

  await recommendations.sort((a, b) => {
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
