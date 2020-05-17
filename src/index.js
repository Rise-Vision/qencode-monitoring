const {request, instance} = require("gaxios");

const {
  ENCODING_API_KEY,
  ENCODING_BUCKET,               // eslint-disable-line no-unused-vars
  ENCODING_STORAGE_ACCESS_KEY,   // eslint-disable-line no-unused-vars
  ENCODING_STORAGE_SECRET        // eslint-disable-line no-unused-vars
} = process.env;

instance.defaults = {
  baseURL: "https://api.qencode.com/v1",
  method: "POST",
  timeout: 5000,
  headers: {
    "content-type": "application/x-www-form-urlencoded"
  }
}

exports.beginNewEncodingHealthCheck = (req, resp)=>{
  console.log({body: req.body});

  const jobData = {};

  return request({url: "/access_token", data: `api_key=${ENCODING_API_KEY}`})
  .then(resp=>Object.assign(jobData, resp.data))
  .then(()=>request({url: "/create_task", data: `token=${jobData.token}`}))
  .then(()=>{resp.send(process.title);});
};

exports.checkJobStatus = (req, resp)=>{
  console.log({body: req.body});
  resp.send(process.title);
};
