import { ChatOpenAI } from '@langchain/openai';
import zod from 'zod';
import { CONFIG } from './config';

const chatJsonResponse = zod.object({
    results: zod.array(zod.object({
      abbreviation: zod.string().describe('Law abbreviation').nullable(),
      title: zod.string().describe('Law title').nullable(),
      text: zod.string().describe('Law text').nullable(),
      queryResult: zod.string().describe('Result from the query'),
    }))
  });
  
  export const createOpenAIInstance = () => new ChatOpenAI(CONFIG.openai);
  
  export const createChatInstanceToParseJson = () => new ChatOpenAI(CONFIG.openai).withStructuredOutput(chatJsonResponse);
  