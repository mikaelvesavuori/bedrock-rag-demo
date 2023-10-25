import { Client } from '@opensearch-project/opensearch';

import { getEmbeddings } from '../infrastructure/bedrock';
import { createIndexObject, getOpenSearchClient } from '../infrastructure/opensearch';

/**
 * @description Embed handler.
 */
export async function handler(event: Record<string, any>) {
  try {
    const records = event.Records || [];
    await embed(records);
  } catch (error) {
    console.error('————— ERROR —————', JSON.stringify(error));

    return {
      statusCode: 500,
      body: error?.message || 'Sorry, something went wrong...'
    };
  }
}

/**
 * @description Use case for embedding documents.
 */
async function embed(records: Record<string, any>[]) {
  const { node, index, region } = getVariables();
  const client = getOpenSearchClient(region, node);

  const promises = records.map(async (record: Record<string, any>) => {
    const input = record.body || '';
    if (input) {
      const embeddings = await getEmbeddings(input);
      await store(client, index, input, embeddings);
    }
  });

  await Promise.all(promises);
}

/**
 * @description Store embeddings in OpenSearch.
 */
async function store(client: Client, index: string, input: string, embeddings: number[][]) {
  if (!input || !embeddings) throw new Error('Missing required input in store()!');

  await client.index(createIndexObject(index, input, embeddings));
}

/**
 * @description Get variables from environment and validate their presence.
 */
function getVariables() {
  const node = process.env.OPENSEARCH_URL || '';
  const index = process.env.OPENSEARCH_INDEX || '';
  const region = process.env.REGION || '';

  if (!node || !index || !region)
    throw new Error(
      'Missing one or more required variables: OPENSEARCH_URL, OPENSEARCH_INDEX, REGION!'
    );

  return { node, index, region };
}
