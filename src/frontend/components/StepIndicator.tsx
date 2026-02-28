"use client";

import { WizardStep } from "@/shared/types";
import { cn } from "@/shared/utils";

const steps: { key: WizardStep; label: string }[] = [
  { key: "scan", label: "System Scan" },
  { key: "chat", label: "Requirements" },
  { key: "deploy", label: "Deploy" },
  { key: "playground", label: "Playground" },
];

const stepOrder: WizardStep[] = ["scan", "chat", "deploy", "playground"];

export function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-primary mr-2">LLMforAll</span>
      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const isActive = step.key === currentStep;
          const isDone = i < currentIndex;

          return (
            <div key={step.key} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && "bg-muted text-muted-foreground",
                  !isActive && !isDone && "text-muted-foreground/50"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    isActive && "bg-primary-foreground text-primary",
                    isDone && "bg-muted-foreground/30 text-muted-foreground",
                    !isActive && !isDone && "bg-muted text-muted-foreground/50"
                  )}
                >
                  {isDone ? "\u2713" : i + 1}
                </span>
                {step.label}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-6 h-px mx-1",
                    i < currentIndex ? "bg-muted-foreground/30" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
