const {CloudTasksClient} = require("@google-cloud/tasks");
const client = new CloudTasksClient();
const project = "rvacore-test";
const region = "us-central1";
const queue = "default";
const queueDelaySecs = 5;

const task = {
  httpRequest: {
    httpMethod: "POST",
    url: "https://us-central1-rvacore-test.cloudfunctions.net/checkEncodingJobStatus",
    oidcToken: {},
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

exports.submitJobStatusTask = jobData=>{
  task.httpRequest.body = Buffer.from(JSON.stringify(jobData)).toString("base64");
  task.httpRequest.oidcToken.serviceAccountEmail = jobData.TASK_SERVICE_ACCOUNT_EMAIL;

  task.scheduleTime = {
    seconds: queueDelaySecs + Date.now() / 1000,
  };

  return client.createTask({
    parent: client.queuePath(project, region, queue),
    task
  });
};
