const tus = require("tus-js-client");
const fs = require("fs");
const filename = "sample.mov";
const filePath = `${__dirname}/../${filename}`;
const file = fs.createReadStream(filePath);
const size = fs.statSync(filePath).size;

exports.startUpload = ({task_token, upload_url})=>{
  return new Promise((res, rej)=>{
    const upload = new tus.Upload(file, {
      endpoint: `${upload_url}/${task_token}`,
      metadata: {filename: filename},
      uploadSize: size,
      onError: error=>{
        console.log(error);
        rej(error);
      },
      onSuccess: ()=>{
        console.log("Upload complete");
        res({data:{tus_url: upload.url}});
      }
    });

    upload.start();
  });
};
