import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import { config } from '../config/config';

/**
 * @description Invoke a model in Bedrock.
 */
export async function invokeBedrock(prompt: string) {
  const { model, modelSettings, region } = config({});
  const { maxTokens, temperature } = modelSettings;

  const client = new BedrockRuntimeClient({ region });

  const response = await client.send(
    new InvokeModelCommand({
      modelId: model,
      body: JSON.stringify({
        maxTokens,
        temperature,
        prompt,
        topP: 1.0
      }),
      accept: 'application/json',
      contentType: 'application/json'
    })
  );

  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.completions[0].data.text;
}

/**
 * @description Get embeddings from Bedrock.
 */
export async function getEmbeddings(input: string): Promise<number[][]> {
  const { region } = config({});

  const client = new BedrockRuntimeClient({ region });

  const response = await client.send(
    new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v1',
      body: JSON.stringify({
        inputText: input
      }),
      accept: 'application/json',
      contentType: 'application/json'
    })
  );

  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.embedding;
}
