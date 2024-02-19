const AWS = require("aws-sdk")
const S3 = require('aws-sdk/clients/s3')

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey
});

const config = new AWS.Config({
  region,
  accessKeyId,
  secretAccessKey
});

// upload a file to s3
module.exports.uploadObject = function (file, folder, userId) {
    const uploadParams = {
      Bucket: `${bucketName}/${folder}/${userId}`,
      Body: file.data,
      Key: file.name
    };
    return s3.upload(uploadParams).promise();
  };