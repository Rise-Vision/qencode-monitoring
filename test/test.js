const {
  beginNewEncodingHealthCheck,
  overrideAdapter,
  overrideStorageClient,
  checkEncodingJobStatus
} = require("../src/index.js");
const uploader = require("../src/uploader.js");
const taskQueue = require ("../src/task-queue.js");
const assert = require("assert");

describe("New Encoding Health Check", ()=>{
  const OK = {status: 200, data: ""};
  const TOKEN = {status: 200, data: {token: "abc"}};
  const TASKDETAILS = {status: 200, data: {task_token: "tokn", upload_url: "up"}};
  const UPLOADRESULT = {data:{tus_url: "tus:"}};
  const STATUSDETAILS = {status: 200, data:{status_url: "stat:"}};

  beforeEach(()=>{
    overrideAdapter(()=>OK);
    uploader.startUpload = ()=>Promise.resolve(UPLOADRESULT);
    taskQueue.submitJobStatusTask = ()=>{};
  });

  it("requests an access token", ()=>{
    let requested = false;

    overrideAdapter((conf)=>{
      if (conf.url.endsWith("access_token")) {requested = true;}
      return OK;
    });

    return beginNewEncodingHealthCheck({}, {end: ()=>{}})
    .then(()=>assert(requested));
  });

  it("creates a task (encoding job)", ()=>{
    let requested = false;

    overrideAdapter((conf)=>{
      if (conf.url.endsWith("access_token")) {return TOKEN}
      if (conf.url.endsWith("create_task")) {
        assert(conf.data === "token=abc");
        requested = true;
      }
      return OK;
    });

    return beginNewEncodingHealthCheck({}, {end: ()=>{}})
    .then(()=>assert(requested));
  });

  it("uploads a file", ()=>{
    let requested = false; 

    overrideAdapter((conf)=>{
      if (conf.url.endsWith("access_token")) {return TOKEN}
      if (conf.url.endsWith("create_task")) {return TASKDETAILS}
      return OK;
    });

    uploader.startUpload = ()=>requested = true;

    return beginNewEncodingHealthCheck({}, {end: ()=>{}})
    .then(()=>assert(requested));
  });

  it("starts encoding job", ()=>{
    let requested = false; 

    overrideAdapter((conf)=>{
      if (conf.url.endsWith("access_token")) {return TOKEN}
      if (conf.url.endsWith("create_task")) {return TASKDETAILS}
      if (conf.url.endsWith("start_encode2")) {
        assert(conf.data.includes("task_token=tokn"));
        requested = true;
        return STATUSDETAILS
      }
      return OK;
    });

    return beginNewEncodingHealthCheck({}, {end: ()=>{}})
    .then(()=>assert(requested));
  });

  it("submits a task queue task to check job status", ()=>{
    let requested = false; 

    taskQueue.submitJobStatusTask = ()=>(requested = true);

    return beginNewEncodingHealthCheck({}, {end: ()=>{}})
    .then(()=>assert(requested));
  });

  it("calls response callback", (done)=>{
    beginNewEncodingHealthCheck({}, {end: ()=>{
      done();
    }});
  });
});

describe("Job Status Checker", ()=>{
  beforeEach(()=>{
    overrideAdapter(()=>({status: 200, data: ""}));
    overrideStorageClient({file:()=>({getMetadata(){}})});
  });

  it("Does not crash if request body is missing", ()=>{
    checkEncodingJobStatus({}, {status:()=>({end: ()=>{}})});
  });

  it("Does not crash if headers are missing", ()=>{
    checkEncodingJobStatus({
      body: {
        status_url: "url:",
        task_token: "tokn"
      },
    }, {status:()=>({end: ()=>{}})});
  });

  it("Requests job status", ()=>{
    let requested = false;

    overrideAdapter((conf)=>{
      if (conf.url.endsWith("url:")) {
        requested = true;
      }

      return {status: 200, data: ""};
    });

    return checkEncodingJobStatus({
      body: {
        status_url: "url:",
        task_token: "tokn"
      },
      headers: {}
    }, {status:()=>({end: ()=>{}})})
    .then(()=>assert(requested));
  });

  it("Checks GCS for file after job completion, returning http 200 to avoid task retry", ()=>{
    let requested = false;
    let statusCode;

    overrideAdapter((conf)=>{
      if (conf.url.endsWith("url:")) {
        requested = true;
      }

      return {status: 200, data: {statuses: {tokn: {status: "completed"}}}};
    });

    overrideStorageClient(()=>({file:()=>({getMetadata(){
      requested = true;
      return [{name: "tokn", size: "1"}];
    }})}));

    return checkEncodingJobStatus({
      body: {
        status_url: "url:",
        task_token: "tokn"
      },
      headers: {}
    }, {status(code) {
      statusCode = code;
      return {end: ()=>{}};
    }})
    .then(()=>assert(requested) && assert(statusCode === 200));
  });
});
