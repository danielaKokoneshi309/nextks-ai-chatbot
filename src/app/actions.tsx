'use server';

import { createStreamableValue } from 'ai/rsc';
import { CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createStreamableUI } from 'ai/rsc';
import { ReactNode } from 'react';
import { z } from 'zod';
import { LawQueryService } from '@/lib/services/queryLaws';


export interface Message {
  role: 'user' | 'assistant';
  content: string;
  display?: ReactNode;
}


export async function LawQuery(query: string) {
  try {
    const results = await LawQueryService.QueryLaws(query);
    return {
      results,
    };
  } catch (error) {
    console.error('Law query error:', error);
    throw new Error('Failed to process law query');
  }
}
// Utils
export async function checkAIAvailability() {
  const envVarExists = !!process.env.OPENAI_API_KEY;
  return envVarExists;
}