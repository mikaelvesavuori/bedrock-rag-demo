import { S3Client, GetObjectCommand, GetObjectCommandInput } from '@aws-sdk/client-s3';

export async function getObjectFromS3Bucket(options: BucketOptions) {
  validate(options);
  const { bucket, key, region } = options;

  const client = new S3Client({ region });
  const params: GetObjectCommandInput = {
    Bucket: bucket,
    Key: key
  };

  const response = await client.send(new GetObjectCommand(params));

  return response;
}

function validate(options: BucketOptions) {
  const region = options.region;
  const bucket = options.bucket;
  const key = options.key;

  if (!region || !bucket || !key) {
    throw new Error('Missing one or more required variables: region, bucket, key!');
  }
}

export type BucketOptions = {
  bucket: string;
  key: string;
  region: string;
};
