import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function run(cmd: string, timeoutMs = 1800000): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: timeoutMs, maxBuffer: 50 * 1024 * 1024 });
    return stdout.trim();
  } catch (e: unknown) {
    const error = e as { stderr?: string; message?: string };
    throw new Error(error.stderr || error.message || 'Command failed');
  }
}

export async function createNetwork(): Promise<void> {
  try {
    await run('docker network create llmforall-net');
  } catch {
    // Network may already exist
  }
}

export async function containerExists(name: string): Promise<boolean> {
  try {
    const result = await run(`docker ps -a --filter name=^${name}$ --format "{{.Names}}"`);
    return result === name;
  } catch {
    return false;
  }
}

export async function removeContainer(name: string): Promise<void> {
  try {
    await run(`docker stop ${name} 2>/dev/null; docker rm ${name} 2>/dev/null`);
  } catch {
    // Container may not exist
  }
}

export async function isContainerRunning(name: string): Promise<boolean> {
  try {
    const result = await run(`docker ps --filter name=^${name}$ --filter status=running --format "{{.Names}}"`);
    return result === name;
  } catch {
    return false;
  }
}

export function streamDockerCommand(
  cmd: string,
  args: string[],
  onData: (data: string) => void,
  onError: (error: string) => void,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);

    child.stdout.on('data', (data: Buffer) => {
      onData(data.toString());
    });

    child.stderr.on('data', (data: Buffer) => {
      onData(data.toString()); // Docker often writes progress to stderr
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      onError(err.message);
      reject(err);
    });
  });
}

export async function waitForHealthy(
  url: string,
  maxRetries = 60,
  intervalMs = 5000,
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}
