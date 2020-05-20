const gax = new (require("gaxios").Gaxios);
const storage = new (require('@google-cloud/storage').Storage);
const uploader = require("./uploader.js");
const taskQueue = require("./task-queue.js");
const setEncodingConfig = require("./set-encoding-config.js");

const {
  ENCODING_API_KEY,
  ENCODING_BUCKET,
  ENCODING_STORAGE_ACCESS_KEY,
  ENCODING_STORAGE_SECRET,
  ACCEPTABLE_DURATION_SECS
} = process.env;

gax.defaults = {
  baseURL: "https://api.qencode.com/v1",
  method: "POST",
  timeout: 5000,
  headers: {
    "content-type": "application/x-www-form-urlencoded"
  }
}

exports.overrideAdapter = (adapter)=>gax.defaults.adapter = adapter;
exports.overrideStorageClient = (bucket)=>storage.bucket = bucket;

exports.beginNewEncodingHealthCheck = (req, resp)=>{
  const ua = req.headers && req.headers["user-agent"] || "unknown user agent";
  console.log(`Started by ${ua}`);

  const jobData = {
    ENCODING_STORAGE_SECRET,
    ENCODING_STORAGE_ACCESS_KEY,
    ENCODING_BUCKET,
  };

  return gax.request({url: "/access_token", data: `api_key=${ENCODING_API_KEY}`})
  .then(resp=>Object.assign(jobData, resp.data))

  .then(()=>gax.request({url: "/create_task", data: `token=${jobData.token}`}))
  .then(resp=>Object.assign(jobData, resp.data))

  .then(()=>uploader.startUpload(jobData))
  .then(resp=>Object.assign(jobData, resp.data))

  .then(()=>gax.request({url: "/start_encode2", data: setEncodingConfig(jobData)}))
  .then(resp=>Object.assign(jobData, resp.data, {
    encoding_start_time: new Date().toISOString()
  }))

  .then(()=>taskQueue.submitJobStatusTask(jobData))

  .catch(console.error)
  .finally(()=>resp.end());
};

exports.checkEncodingJobStatus = (req, resp)=>{
  if (!req || !req.body || !req.headers) {
    console.error("No request body");
    return resp.status().end();
  }

  const {status_url, task_token, encoding_start_time} = req.body;
  console.log(`Retry count: ${req.headers["x-cloudtasks-taskretrycount"]}`);

  return gax.request({
    baseURL: "",
    url: status_url,
    data: `task_tokens=${task_token}`
  })
  .then(resp=>{
    if (!resp.data.statuses) return Promise.reject("Invalid status response");

    const taskStatus = resp.data.statuses[task_token];
    if (!taskStatus) return Promise.reject("Missing response data");

    console.log(`Current status: ${taskStatus.status}`);
    if (taskStatus.status !== "completed") return Promise.reject("Retry");

    return storage.bucket(ENCODING_BUCKET).file(task_token).getMetadata();
  })
  .then(([metadata])=>{
    const success = metadata.name === task_token && Number(metadata.size) > 0;
    const ms = new Date(metadata.timeCreated) - new Date(encoding_start_time);
    const acceptable = ms / 1000 <= Number(ACCEPTABLE_DURATION_SECS);

    if (success) {
      console.log(`Encoding task: ${task_token} took ${ms / 1000}s`);
      console.log(`${acceptable ? "acceptable" : "unacceptable"} duration`);
    }

    return resp.status(200).end();
  })
  .catch(e=>{
    console.error(e);
    resp.status(500).end();
  });
};
