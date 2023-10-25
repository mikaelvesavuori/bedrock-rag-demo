import { S3EventRecord } from 'aws-lambda';
import * as llmchunk from 'llm-chunk';

import { getObjectFromS3Bucket } from '../infrastructure/s3';
import { putOnQueue } from '../infrastructure/sqs';

/**
 * @description Chunk handler.
 */
export async function handler(event: Record<string, any>) {
  try {
    const records: Record<string, any> = event?.Records || [];
    await chunk(records);
  } catch (error) {
    console.error('————— ERROR —————', JSON.stringify(error));

    return {
      statusCode: 500,
      body: error?.message || 'Sorry, something went wrong...'
    };
  }
}

/**
 * @description Use case for chunking documents and putting each chunk in an SQS queue.
 */
async function chunk(records: Record<string, any>) {
  const { awsAccountNumber, region, queueName } = getVariables();

  // Get chunks of all objects
  const chunkPromises = records.map(async (record: S3EventRecord): Promise<string[]> => {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    const object = await getObjectFromS3Bucket({
      bucket,
      key,
      region
    });
    console.log('Object facts:', object.ContentLength, object.ContentType);

    const content = await getFileContent(object);

    return getFileChunks(content);
  });

  // Put messages on queue for each individual chunk
  const promises = await Promise.all(chunkPromises).then(async (chunks: string[][]) =>
    chunks
      .flat()
      .map(
        async (chunk: string) =>
          await putOnQueue({ data: chunk, region, awsAccountNumber, queueName })
      )
  );

  await Promise.all(promises);
}

/**
 * @description Retrieve the actual text content from the file.
 */
async function getFileContent(object: any) {
  if (object.ContentType === 'text/plain') return await object.Body.transformToString();
  console.log('Object is not a plaintext file, skipping embedding...');
}

/**
 * @description Chunk the text contents into an array of strings.
 */
function getFileChunks(content: string) {
  const chunks = llmchunk.chunk(content, {
    minLength: 1,
    maxLength: 1000,
    splitter: 'paragraph',
    overlap: 20,
    delimiters: '\n'
  });

  console.log(`Produced ${chunks.length} chunks`);

  return chunks;
}

/**
 * @description Get variables from environment and validate their presence.
 */
function getVariables() {
  const region = process.env.REGION || '';
  const awsAccountNumber = process.env.AWS_ACCOUNT_NUMBER || '';
  const queueName = process.env.QUEUE_NAME || '';

  if (!region || !awsAccountNumber || !queueName)
    throw new Error(
      'Missing one or more required variables: REGION, AWS_ACCOUNT_NUMBER, QUEUE_NAME!'
    );

  return { region, awsAccountNumber, queueName };
}
