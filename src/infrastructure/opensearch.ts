import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { Client } from '@opensearch-project/opensearch';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

/**
 * @description Pass back an OpenSearch client that is ready to use.
 */
export function getOpenSearchClient(region: string, node: string) {
  return new Client({
    ...AwsSigv4Signer({
      region,
      service: 'aoss',
      getCredentials: () => {
        const credentialsProvider = defaultProvider();
        return credentialsProvider();
      }
    }),
    node
  });
}

/**
 * @description Create an indexing object for OpenSearch.
 */
export function createIndexObject(index: string, text: string, embeddings: number[][]) {
  return {
    index,
    body: {
      text,
      document_vector: embeddings
    }
  };
}

/**
 * @description Create a search query for OpenSearch.
 */
export function createSearchQuery(index: string, vector: number[][]) {
  return {
    index,
    body: {
      size: 15,
      _source: { excludes: ['document_vector'] },
      query: {
        knn: {
          document_vector: {
            vector,
            k: 15
          }
        }
      }
    }
  };
}
