export const CONFIG = {
    weaviate: {
      url: process.env.WEAVIATE_URL || 'localhost:8080',
      apiKey: process.env.WEAVIATE_API_KEY || 'default',
      scheme: 'https'
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'default',
      model: 'gpt-4-1106-preview',
      temperature: 0,
      maxTokens: 4096
    }
  } as const;