import { NextResponse } from 'next/server';
import { isContainerRunning } from '@/backend/deployer/docker';

export async function GET() {
  try {
    const [vllmRunning, ollamaRunning, webuiRunning] = await Promise.all([
      isContainerRunning('llmfa-vllm'),
      isContainerRunning('llmfa-ollama'),
      isContainerRunning('llmfa-webui'),
    ]);

    const framework = vllmRunning ? 'vllm' : ollamaRunning ? 'ollama' : null;
    const modelServerUrl = vllmRunning
      ? 'http://localhost:8000'
      : ollamaRunning
        ? 'http://localhost:11434'
        : null;

    return NextResponse.json({
      modelServer: {
        running: vllmRunning || ollamaRunning,
        url: modelServerUrl,
        framework,
      },
      openWebUI: {
        running: webuiRunning,
        url: webuiRunning ? 'http://localhost:3001' : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Status check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
