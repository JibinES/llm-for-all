"use client";

import { useState } from "react";
import { useWizardStore } from "@/frontend/store/wizard";
import { Button } from "@/frontend/components/ui/button";

export function LandingPage() {
  const setStep = useWizardStore((s) => s.setStep);
  const loadTestPreset = useWizardStore((s) => s.loadTestPreset);
  const loadTestPresetOllama = useWizardStore((s) => s.loadTestPresetOllama);
  const [showTest, setShowTest] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 relative">
      {/* Test menu - top right corner */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={() => setShowTest(!showTest)}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors px-2 py-1"
          >
            Dev
          </button>
          {showTest && (
            <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg p-2 space-y-1 min-w-[160px] z-50">
              <button
                onClick={loadTestPresetOllama}
                className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-muted transition-colors"
              >
                Test Ollama
              </button>
              <button
                onClick={loadTestPreset}
                className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-muted transition-colors"
              >
                Test vLLM
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            LLM<span className="text-primary">for</span>All
          </h1>
          <p className="text-xl text-muted-foreground">
            From bare metal to a fully running, secure, locally-hosted AI service
            in minutes — with zero manual configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="text-2xl mb-2">1</div>
            <h3 className="font-semibold mb-1">Scan</h3>
            <p className="text-sm text-muted-foreground">
              We detect your hardware — GPU, CPU, RAM, everything.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="text-2xl mb-2">2</div>
            <h3 className="font-semibold mb-1">Chat</h3>
            <p className="text-sm text-muted-foreground">
              Tell our AI agent what you need. It picks the perfect model.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="text-2xl mb-2">3</div>
            <h3 className="font-semibold mb-1">Deploy</h3>
            <p className="text-sm text-muted-foreground">
              One click. Docker containers spin up. You&apos;re live.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="text-lg px-8 py-6"
          onClick={() => setStep("scan")}
        >
          Get Started
        </Button>

        <p className="text-xs text-muted-foreground">
          AMD Slingshot Hackathon — AutoDeploy LLM Agent
        </p>
      </div>
    </div>
  );
}
