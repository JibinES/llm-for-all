import { DeploymentConfig } from '@/shared/types';
import { run, createNetwork, removeContainer, waitForHealthy } from '@/backend/deployer/docker';

export async function deployOllama(
  config: DeploymentConfig,
  onProgress: (step: string, message: string) => void,
): Promise<string> {
  const containerName = 'llmfa-ollama';
  const port = config.port || 11434;

  onProgress('network', 'Creating Docker network...');
  await createNetwork();

  onProgress('cleanup', 'Removing existing Ollama container if any...');
  await removeContainer(containerName);

  onProgress('pull', 'Pulling Ollama Docker image...');
  await run('docker pull ollama/ollama:latest');

  onProgress('start', 'Starting Ollama container...');

  const gpuFlag = config.gpuEnabled ? '--gpus all' : '';

  const dockerCmd = [
    'docker run -d',
    `--name ${containerName}`,
    '--network llmforall-net',
    gpuFlag,
    '-v ollama-data:/root/.ollama',
    `-p ${port}:11434`,
    'ollama/ollama:latest',
  ]
    .filter(Boolean)
    .join(' ');

  await run(dockerCmd);

  onProgress('health', 'Waiting for Ollama to start...');
  const healthy = await waitForHealthy(`http://localhost:${port}/api/tags`, 30, 3000);
  if (!healthy) {
    throw new Error('Ollama failed to start within timeout.');
  }

  onProgress('model', `Pulling model ${config.modelId} (this may take several minutes)...`);
  await run(`docker exec ${containerName} ollama pull ${config.modelId}`);

  // Apply guardrails via Modelfile if provided
  if (config.guardrailPrompt) {
    onProgress('guardrails', 'Applying guardrails via Modelfile...');

    const modelfile = `FROM ${config.modelId}
SYSTEM """${config.guardrailPrompt}"""
PARAMETER temperature 0.7
PARAMETER num_ctx ${config.maxModelLen || 8192}`;

    // Write Modelfile and create custom model
    const escapedModelfile = modelfile.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    await run(
      `docker exec ${containerName} bash -c 'echo -e "${escapedModelfile}" > /tmp/Modelfile && ollama create llmfa-custom -f /tmp/Modelfile'`,
    );

    onProgress('guardrails', 'Guardrails applied. Using custom model.');
  }

  onProgress('ready', `Ollama is ready! API endpoint: http://localhost:${port}`);
  return `http://localhost:${port}`;
}
