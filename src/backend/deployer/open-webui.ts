import { run, createNetwork, removeContainer, waitForHealthy } from '@/backend/deployer/docker';

export async function deployOpenWebUI(
  framework: 'vllm' | 'ollama',
  onProgress: (step: string, message: string) => void,
): Promise<string> {
  const containerName = 'llmfa-webui';
  const port = 3001;

  onProgress('webui-cleanup', 'Removing existing Open WebUI container if any...');
  await removeContainer(containerName);

  await createNetwork();

  onProgress('webui-pull', 'Pulling Open WebUI Docker image...');
  await run('docker pull ghcr.io/open-webui/open-webui:main');

  onProgress('webui-start', 'Starting Open WebUI...');

  let envVars: string;
  if (framework === 'vllm') {
    envVars = '-e OPENAI_API_BASE_URLS=http://llmfa-vllm:8000/v1 -e OPENAI_API_KEYS=not-needed';
  } else {
    envVars = '-e OLLAMA_BASE_URL=http://llmfa-ollama:11434';
  }

  const dockerCmd = [
    'docker run -d',
    `--name ${containerName}`,
    '--network llmforall-net',
    `-p ${port}:8080`,
    envVars,
    '-e WEBUI_AUTH=false',
    '-v open-webui-data:/app/backend/data',
    'ghcr.io/open-webui/open-webui:main',
  ].join(' ');

  await run(dockerCmd);

  onProgress('webui-health', 'Waiting for Open WebUI to start...');
  const healthy = await waitForHealthy(`http://localhost:${port}`, 60, 3000);

  if (!healthy) {
    throw new Error('Open WebUI failed to start within timeout.');
  }

  onProgress('webui-ready', `Open WebUI is ready at http://localhost:${port}`);
  return `http://localhost:${port}`;
}
