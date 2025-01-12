'use server';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Keep this for environment checking
export async function checkAIAvailability() {
  const envVarExists = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  return envVarExists;
}
