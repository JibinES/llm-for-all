import { DeploymentConfig } from '@/shared/types';
import { run, createNetwork, removeContainer, waitForHealthy } from '@/backend/deployer/docker';

export async function deployVLLM(
  config: DeploymentConfig,
  onProgress: (step: string, message: string) => void,
): Promise<string> {
  const containerName = 'llmfa-vllm';
  const port = config.port || 8000;

  onProgress('network', 'Creating Docker network...');
  await createNetwork();

  onProgress('cleanup', 'Removing existing vLLM container if any...');
  await removeContainer(containerName);

  onProgress('pull', 'Pulling vLLM Docker image (this may take a few minutes)...');
  await run('docker pull vllm/vllm-openai:latest');

  onProgress('start', `Starting vLLM with model ${config.modelId}...`);

  const gpuFlag = config.gpuEnabled ? '--gpus all' : '';
  const quantFlag = config.quantization ? `--quantization ${config.quantization}` : '';

  const dockerCmd = [
    'docker run -d',
    `--name ${containerName}`,
    '--network llmforall-net',
    gpuFlag,
    '-v ~/.cache/huggingface:/root/.cache/huggingface',
    `-p ${port}:8000`,
    '--ipc=host',
    'vllm/vllm-openai:latest',
    `--model ${config.modelId}`,
    quantFlag,
    `--max-model-len ${config.maxModelLen || 8192}`,
    '--gpu-memory-utilization 0.9',
  ]
    .filter(Boolean)
    .join(' ');

  await run(dockerCmd);

  onProgress('health', 'Waiting for vLLM to load the model (this can take several minutes)...');
  const healthy = await waitForHealthy(`http://localhost:${port}/v1/models`, 120, 5000);

  if (!healthy) {
    throw new Error('vLLM failed to start within timeout. Check docker logs llmfa-vllm for details.');
  }

  onProgress('ready', `vLLM is ready! API endpoint: http://localhost:${port}/v1`);
  return `http://localhost:${port}`;
}
