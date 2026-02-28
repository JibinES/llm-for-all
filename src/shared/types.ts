export interface SystemSpecs {
  cpu: {
    model: string;
    cores: number;
    architecture: string;
  };
  gpu: {
    available: boolean;
    vendor: string; // 'nvidia' | 'amd' | 'apple' | 'intel' | 'none'
    model: string;
    vram: number; // in GB
  };
  ram: {
    total: number; // in GB
    available: number;
  };
  disk: {
    available: number; // in GB
  };
  os: {
    platform: string;
    version: string;
  };
  docker: {
    installed: boolean;
    running: boolean;
    version: string;
  };
}

export interface UserRequirements {
  useCase: string;
  concurrentUsers: number;
  contextNeeds: string;
  speedVsQuality: string;
  guardrails: string[];
  languageFocus: string;
  additionalNotes: string;
}

export interface ModelRecommendation {
  modelName: string;
  modelId: string; // e.g., "Qwen/Qwen2.5-14B-Instruct-AWQ"
  parameters: string;
  quantization: string;
  framework: 'vllm' | 'ollama';
  frameworkReason: string;
  estimatedSpeed: string;
  contextWindow: number;
  vramRequired: number;
  reasoning: string;
}

export interface DeploymentConfig {
  framework: 'vllm' | 'ollama';
  modelId: string;
  port: number;
  guardrailPrompt: string;
  gpuEnabled: boolean;
  maxModelLen: number;
  quantization: string;
}

export interface DeploymentStatus {
  step: string;
  message: string;
  progress: number; // 0-100
  status: 'pending' | 'running' | 'done' | 'error';
}

export interface ServiceStatus {
  modelServer: {
    running: boolean;
    url: string;
    framework: string;
    model: string;
  };
  openWebUI: {
    running: boolean;
    url: string;
  };
}

export type WizardStep = 'landing' | 'scan' | 'chat' | 'deploy' | 'playground';
