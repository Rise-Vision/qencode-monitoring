module.exports = ({
  tus_url,
  task_token,
  ENCODING_STORAGE_SECRET,
  ENCODING_BUCKET,
  ENCODING_STORAGE_ACCESS_KEY
})=>{
  if (!tus_url) return {task_token};

  const query = {
    "query": {
      "source": `tus:${tus_url.split("/").pop()}`,
      "format": [
        {
          "output": "mp4",
          "destination": {
            "url": `s3://storage.googleapis.com/${ENCODING_BUCKET}/${task_token}`,
            "key": ENCODING_STORAGE_ACCESS_KEY,
            "secret": encodeURIComponent(ENCODING_STORAGE_SECRET)
          }
        }
      ]
    }
  };

  return `task_token=${task_token}&query=${JSON.stringify(query)}`;
};
