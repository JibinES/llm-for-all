import { streamText } from 'ai';
import { agentModel } from '@/backend/agent/client';
import { buildSystemPrompt } from '@/backend/agent/system-prompt';

export async function POST(req: Request) {
  const { messages, specs } = await req.json();

  const systemPrompt = buildSystemPrompt(specs);

  const result = streamText({
    model: agentModel,
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
