import { SQSClient, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';

/**
 * @description Put document chunk on SQS queue.
 */
export async function putOnQueue(options: QueueOptions) {
  validate(options);
  const { awsAccountNumber, object, queueName, region } = options;

  const client = new SQSClient({ region });
  const queueUrl = `https://sqs.${region}.amazonaws.com/${awsAccountNumber}/${queueName}`;
  const params: SendMessageCommandInput = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(object)
  };

  await client.send(new SendMessageCommand(params));
}

function validate(options: QueueOptions) {
  const awsAccountNumber = options.awsAccountNumber;
  const object = options.object;
  const queueName = options.queueName;
  const region = options.region;

  if (!awsAccountNumber || !object || !queueName || !region) {
    throw new Error(
      'Missing one or more required variables: awsAccountNumber, object, queueName, region!'
    );
  }
}

export type QueueOptions = {
  awsAccountNumber: string;
  object: string;
  queueName: string;
  region: string;
};
