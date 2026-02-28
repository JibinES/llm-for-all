import { createOpenAI } from '@ai-sdk/openai';

export const agentProvider = createOpenAI({
  baseURL: process.env.KARUNYA_BASE_URL || 'https://llm.karunya.ai/v1',
  apiKey: process.env.KARUNYA_API_KEY || 'sk-placeholder',
});

export const agentModel = agentProvider.chat(process.env.KARUNYA_MODEL || 'smart');
