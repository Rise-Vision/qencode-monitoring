const {CloudTasksClient} = require("@google-cloud/tasks");
const client = new CloudTasksClient();
const queueDelaySecs = 5;

const {
  GCP_PROJECT,
  GCP_REGION,
  QUEUE_NAME,
  TASK_CHECKER_TRIGGER_URL,
  TASK_SERVICE_ACCOUNT_EMAIL
} = process.env;

const task = {
  httpRequest: {
    httpMethod: "POST",
    url: TASK_CHECKER_TRIGGER_URL,
    oidcToken: {
      serviceAccountEmail: TASK_SERVICE_ACCOUNT_EMAIL
    },
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

exports.submitJobStatusTask = jobData=>{
  task.httpRequest.body = Buffer.from(JSON.stringify(jobData)).toString("base64");

  task.scheduleTime = {
    seconds: queueDelaySecs + Date.now() / 1000,
  };

  return client.createTask({
    parent: client.queuePath(GCP_PROJECT, GCP_REGION, QUEUE_NAME),
    task
  });
};
