exports.beginNewEncodingHealthCheck = (req, resp)=>{
  console.log({body: req.body});
  resp.send(process.title);
};

exports.checkJobStatus = (req, resp)=>{
  console.log({body: req.body});
  resp(process.title);
};
