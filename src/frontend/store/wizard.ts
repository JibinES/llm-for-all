import { create } from 'zustand';
import { SystemSpecs, ModelRecommendation, WizardStep, DeploymentConfig } from '@/shared/types';

interface WizardState {
  step: WizardStep;
  specs: SystemSpecs | null;
  recommendation: ModelRecommendation | null;
  deploymentConfig: DeploymentConfig | null;
  deployedModelUrl: string | null;
  openWebUIUrl: string | null;
  guardrailPrompt: string;

  setStep: (step: WizardStep) => void;
  setSpecs: (specs: SystemSpecs) => void;
  setRecommendation: (rec: ModelRecommendation) => void;
  setDeploymentConfig: (config: DeploymentConfig) => void;
  setDeployedModelUrl: (url: string) => void;
  setOpenWebUIUrl: (url: string) => void;
  setGuardrailPrompt: (prompt: string) => void;
  loadTestPreset: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  step: 'landing',
  specs: null,
  recommendation: null,
  deploymentConfig: null,
  deployedModelUrl: null,
  openWebUIUrl: null,
  guardrailPrompt: '',

  setStep: (step) => set({ step }),
  setSpecs: (specs) => set({ specs }),
  setRecommendation: (recommendation) => set({ recommendation }),
  setDeploymentConfig: (deploymentConfig) => set({ deploymentConfig }),
  setDeployedModelUrl: (deployedModelUrl) => set({ deployedModelUrl }),
  setOpenWebUIUrl: (openWebUIUrl) => set({ openWebUIUrl }),
  setGuardrailPrompt: (guardrailPrompt) => set({ guardrailPrompt }),
  loadTestPreset: () =>
    set({
      step: 'deploy',
      recommendation: {
        modelName: 'Gemma 3 1B',
        modelId: 'google/gemma-3-1b-it',
        parameters: '1B',
        quantization: 'none',
        framework: 'vllm',
        frameworkReason: 'Test preset for validating the full deployment flow',
        estimatedSpeed: '~50 tok/s',
        contextWindow: 8192,
        vramRequired: 2,
        reasoning: 'Lightweight test model to verify the entire pipeline works end-to-end.',
      },
      deploymentConfig: {
        framework: 'vllm',
        modelId: 'google/gemma-3-1b-it',
        port: 8000,
        guardrailPrompt: '',
        gpuEnabled: true,
        maxModelLen: 8192,
        quantization: '',
      },
    }),
  reset: () =>
    set({
      step: 'landing',
      specs: null,
      recommendation: null,
      deploymentConfig: null,
      deployedModelUrl: null,
      openWebUIUrl: null,
      guardrailPrompt: '',
    }),
}));
