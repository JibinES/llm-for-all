"use client";

import { useState, useEffect, useRef } from "react";
import { useWizardStore } from "@/frontend/store/wizard";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";

interface LogEntry {
  step: string;
  message: string;
  timestamp: number;
}

export function DeployPage() {
  const {
    deploymentConfig,
    recommendation,
    setStep,
    setDeployedModelUrl,
    setOpenWebUIUrl,
  } = useWizardStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "deploying" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDeploy = async () => {
    if (!deploymentConfig) return;

    setStatus("deploying");
    setLogs([]);
    setError(null);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deploymentConfig),
      });

      if (!res.ok || !res.body) {
        throw new Error("Deployment request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: LogEntry = JSON.parse(line.slice(6));

              if (data.step === "complete") {
                const urls = JSON.parse(data.message);
                setDeployedModelUrl(urls.modelUrl);
                setOpenWebUIUrl(urls.webuiUrl);
                setStatus("done");
              } else if (data.step === "error") {
                setError(data.message);
                setStatus("error");
              } else {
                setLogs((prev) => [...prev, data]);
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deployment failed");
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Deploy</h2>
          <p className="text-muted-foreground">
            Setting up your local LLM infrastructure via Docker.
          </p>
        </div>

        {recommendation && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                Deployment Plan
                <Badge variant="secondary">{recommendation.framework}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Model:</span>{" "}
                {recommendation.modelName} ({recommendation.modelId})
              </p>
              <p>
                <span className="text-muted-foreground">Framework:</span>{" "}
                {recommendation.framework === "vllm"
                  ? "vLLM (Docker)"
                  : "Ollama (Docker)"}
              </p>
              <p>
                <span className="text-muted-foreground">Containers:</span>{" "}
                {recommendation.framework === "vllm" ? "vLLM" : "Ollama"} + Open
                WebUI
              </p>
            </CardContent>
          </Card>
        )}

        {status === "idle" && (
          <Button onClick={handleDeploy} size="lg" className="w-full">
            Start Deployment
          </Button>
        )}

        {(status === "deploying" || logs.length > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                Deployment Log
                {status === "deploying" && (
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                )}
                {status === "done" && (
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                )}
                {status === "error" && (
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64" ref={scrollRef}>
                <div className="font-mono text-xs space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-green-500 shrink-0">
                        {log.step === "error" ? "[ERR]" : "[OK]"}
                      </span>
                      <span className="text-muted-foreground">
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {status === "deploying" && (
                    <div className="flex gap-2 animate-pulse">
                      <span className="text-yellow-500">[...]</span>
                      <span className="text-muted-foreground">
                        Working...
                      </span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                onClick={handleDeploy}
                variant="outline"
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "done" && (
          <div className="space-y-4">
            <Card className="border-green-500/50">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-semibold text-green-500">
                    Deployment Successful
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Model API:</span>{" "}
                    <code className="bg-muted px-1 rounded">
                      {recommendation?.framework === "vllm"
                        ? "http://localhost:8000/v1"
                        : "http://localhost:11434/v1"}
                    </code>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Open WebUI:</span>{" "}
                    <a
                      href="http://localhost:3001"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      http://localhost:3001
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => setStep("playground")}
              size="lg"
              className="w-full"
            >
              Open Playground
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
