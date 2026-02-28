"use client";

import { useWizardStore } from "@/frontend/store/wizard";
import { StepIndicator } from "@/frontend/components/StepIndicator";
import { LandingPage } from "@/frontend/components/LandingPage";
import { ScanPage } from "@/frontend/components/ScanPage";
import { ChatPage } from "@/frontend/components/ChatPage";
import { DeployPage } from "@/frontend/components/DeployPage";
import { PlaygroundPage } from "@/frontend/components/PlaygroundPage";

export default function Home() {
  const { step } = useWizardStore();

  return (
    <div className="min-h-screen flex flex-col">
      {step !== "landing" && (
        <div className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <StepIndicator currentStep={step} />
          </div>
        </div>
      )}

      <main className="flex-1">
        {step === "landing" && <LandingPage />}
        {step === "scan" && <ScanPage />}
        {step === "chat" && <ChatPage />}
        {step === "deploy" && <DeployPage />}
        {step === "playground" && <PlaygroundPage />}
      </main>
    </div>
  );
}
