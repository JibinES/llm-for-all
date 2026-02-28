import { NextResponse } from 'next/server';
import { DeploymentConfig } from '@/shared/types';
import { deployVLLM } from '@/backend/deployer/vllm';
import { deployOllama } from '@/backend/deployer/ollama';
import { deployOpenWebUI } from '@/backend/deployer/open-webui';

export async function POST(req: Request) {
  const config: DeploymentConfig = await req.json();

  // Use SSE for streaming progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (step: string, message: string) => {
        const data = JSON.stringify({ step, message, timestamp: Date.now() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        // Deploy model server
        let modelUrl: string;
        if (config.framework === 'vllm') {
          modelUrl = await deployVLLM(config, send);
        } else {
          modelUrl = await deployOllama(config, send);
        }

        // Deploy Open WebUI
        const webuiUrl = await deployOpenWebUI(config.framework, send);

        send('complete', JSON.stringify({ modelUrl, webuiUrl }));
        controller.close();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Deployment failed';
        send('error', message);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
