import weaviate from 'weaviate-ts-client';
import { WeaviateStore } from '@langchain/weaviate';
import { OpenAIEmbeddings } from '@langchain/openai';
import { CONFIG } from './config';

const client = weaviate.client({
    scheme: 'https',
    host: CONFIG.weaviate.url,
    apiKey: new weaviate.ApiKey(CONFIG.weaviate.apiKey),
  });
  
  const embeddings = new OpenAIEmbeddings({
    apiKey: CONFIG.openai.apiKey,
  });
  
  const getVectorStore = async () =>
    WeaviateStore.fromExistingIndex(embeddings, {
      client,
      indexName: 'Laws',
      textKey: 'text',
      metadataKeys: ['abbreviation', 'title', 'text', 'seq'],
    });
  export default getVectorStore;
  