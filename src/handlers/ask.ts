import { Client } from '@opensearch-project/opensearch';

import { getEmbeddings, invokeBedrock } from '../infrastructure/bedrock';
import { createSearchQuery, getOpenSearchClient } from '../infrastructure/opensearch';

/**
 * @description Ask handler.
 */
export async function handler(event: Record<string, any>) {
  try {
    const question = getInput(event);
    if (!question) throw new Error('Missing question!');

    const result = await ask(question);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('————— ERROR —————', JSON.stringify(error));

    return {
      statusCode: 500,
      body: error?.message || 'Sorry, something went wrong...'
    };
  }
}

function getInput(event: Record<string, any>) {
  return event?.queryStringParameters?.ask || '';
}

/**
 * @description Use case for answering a question with the LLM.
 *
 * It does this by getting the "context" (through vector embeddings),
 * and then creating a prompt including both this context and the
 * user-provided question.
 */
async function ask(question: string) {
  if (!question) throw new Error('Missing a question!');

  console.log('Question:', question);

  const { node, index, region } = getVariables();

  const client = getOpenSearchClient(region, node);
  const questionEmbeddings = await getEmbeddings(question);
  const context = await getContext(client, index, questionEmbeddings);
  const answer = await askQuestion(context, question);

  return answer;
}

/**
 * @description Get contextual data based on the question's vector embeddings.
 */
async function getContext(openSearchClient: Client, index: string, questionEmbeddings: number[][]) {
  const contextData = await openSearchClient.search(createSearchQuery(index, questionEmbeddings));
  console.log('Full context response:', JSON.stringify(contextData));

  const hits = contextData?.body?.hits?.hits || [];
  console.log('Search hits:', hits);

  const context = hits.map((item: Record<string, any>) => item._source.text).join(', ');
  console.log('Context: ', context);

  return context;
}

/**
 * @description Pass a well-formed prompt to Bedrock.
 */
async function askQuestion(context: string, question: string) {
  const prompt = `Context:\n\n"""${context}"""\n\nBased on the above context, please answer the question. Answer:\n\n"""${question}"""`;
  console.log('Prompt: ', prompt);

  const answer = await invokeBedrock(prompt);
  console.log('Answer:', JSON.stringify(answer));

  return answer;
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
