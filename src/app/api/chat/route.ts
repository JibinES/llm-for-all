import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { messages, modelUrl, guardrailPrompt, model } = await req.json();

  if (!modelUrl) {
    return NextResponse.json({ error: 'No model URL provided' }, { status: 400 });
  }

  // Determine the API format based on the URL
  const isOllama = modelUrl.includes('11434');
  const apiUrl = isOllama ? `${modelUrl}/v1/chat/completions` : `${modelUrl}/v1/chat/completions`;

  // Inject guardrail system prompt
  const allMessages = guardrailPrompt
    ? [{ role: 'system', content: guardrailPrompt }, ...messages]
    : messages;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'default',
        messages: allMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    // Forward the stream
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
