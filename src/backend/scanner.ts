import { exec } from 'child_process';
import { promisify } from 'util';
import { SystemSpecs } from '@/shared/types';

const execAsync = promisify(exec);

async function run(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 10000 });
    return stdout.trim();
  } catch {
    return '';
  }
}

async function detectCPU() {
  const platform = process.platform;

  if (platform === 'darwin') {
    const model = await run('sysctl -n machdep.cpu.brand_string');
    const cores = await run('sysctl -n hw.ncpu');
    const arch = await run('uname -m');
    return {
      model: model || 'Unknown',
      cores: parseInt(cores) || 0,
      architecture: arch || 'unknown',
    };
  }

  // Linux
  const model = await run("lscpu | grep 'Model name' | cut -d: -f2 | xargs");
  const cores = await run('nproc');
  const arch = await run('uname -m');
  return {
    model: model || 'Unknown',
    cores: parseInt(cores) || 0,
    architecture: arch || 'unknown',
  };
}

async function detectGPU() {
  // Check NVIDIA
  const nvidiaSmi = await run('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>/dev/null');
  if (nvidiaSmi) {
    const parts = nvidiaSmi.split(',').map(s => s.trim());
    return {
      available: true,
      vendor: 'nvidia',
      model: parts[0] || 'Unknown NVIDIA GPU',
      vram: Math.round((parseInt(parts[1]) || 0) / 1024), // MB to GB
    };
  }

  // Check AMD
  const rocmSmi = await run('rocm-smi --showproductname --showmeminfo vram --csv 2>/dev/null');
  if (rocmSmi) {
    const lines = rocmSmi.split('\n');
    const model = lines.find(l => l.includes('card'))?.split(',')[1]?.trim() || 'Unknown AMD GPU';
    const vramLine = await run("rocm-smi --showmeminfo vram 2>/dev/null | grep 'Total' | awk '{print $3}'");
    const vramMB = parseInt(vramLine) || 0;
    return {
      available: true,
      vendor: 'amd',
      model,
      vram: Math.round(vramMB / 1024),
    };
  }

  // Check Apple Silicon
  if (process.platform === 'darwin') {
    const chip = await run("system_profiler SPHardwareDataType | grep 'Chip' | cut -d: -f2 | xargs");
    if (chip && chip.includes('Apple')) {
      // Apple Silicon shares RAM as unified memory
      const ramStr = await run("sysctl -n hw.memsize");
      const ramGB = Math.round(parseInt(ramStr) / (1024 * 1024 * 1024));
      return {
        available: true,
        vendor: 'apple',
        model: chip,
        vram: ramGB, // Unified memory
      };
    }
  }

  return {
    available: false,
    vendor: 'none',
    model: 'No GPU detected',
    vram: 0,
  };
}

async function detectRAM() {
  if (process.platform === 'darwin') {
    const total = await run('sysctl -n hw.memsize');
    const totalGB = Math.round(parseInt(total) / (1024 * 1024 * 1024));
    // macOS doesn't easily expose available RAM via CLI
    const vmStat = await run("vm_stat | grep 'Pages free' | awk '{print $3}' | tr -d '.'");
    const freePages = parseInt(vmStat) || 0;
    const availableGB = Math.round((freePages * 4096) / (1024 * 1024 * 1024));
    return { total: totalGB, available: availableGB || Math.round(totalGB * 0.5) };
  }

  const total = await run("free -g | awk '/^Mem:/{print $2}'");
  const available = await run("free -g | awk '/^Mem:/{print $7}'");
  return {
    total: parseInt(total) || 0,
    available: parseInt(available) || 0,
  };
}

async function detectDisk() {
  if (process.platform === 'darwin') {
    const df = await run("df -g / | awk 'NR==2{print $4}'");
    return { available: parseInt(df) || 0 };
  }
  const df = await run("df -BG / | awk 'NR==2{print $4}' | tr -d 'G'");
  return { available: parseInt(df) || 0 };
}

async function detectDocker() {
  const version = await run('docker --version 2>/dev/null');
  if (!version) {
    return { installed: false, running: false, version: '' };
  }

  const running = await run('docker info 2>/dev/null');
  return {
    installed: true,
    running: !!running,
    version: version.replace('Docker version ', '').split(',')[0],
  };
}

export async function scanSystem(): Promise<SystemSpecs> {
  const [cpu, gpu, ram, disk, docker] = await Promise.all([
    detectCPU(),
    detectGPU(),
    detectRAM(),
    detectDisk(),
    detectDocker(),
  ]);

  return {
    cpu,
    gpu,
    ram,
    disk,
    os: {
      platform: process.platform,
      version: await run('uname -r'),
    },
    docker,
  };
}
