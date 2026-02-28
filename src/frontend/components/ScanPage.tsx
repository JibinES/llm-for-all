"use client";

import { useState } from "react";
import { useWizardStore } from "@/frontend/store/wizard";
import { SystemSpecs } from "@/shared/types";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";

export function ScanPage() {
  const { specs, setSpecs, setStep } = useWizardStore();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/scan");
      if (!res.ok) throw new Error("Scan failed");
      const data: SystemSpecs = await res.json();
      setSpecs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {!specs ? (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">System Scan</h2>
            <p className="text-muted-foreground">
              We need to scan your system to understand what hardware is available.
              This checks CPU, GPU, RAM, disk space, and Docker status.
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                This scan runs locally on your machine. No data is sent externally.
                We&apos;ll use shell commands like <code>nvidia-smi</code>,{" "}
                <code>sysctl</code>, and <code>docker --version</code>.
              </p>
              <Button
                onClick={handleScan}
                disabled={scanning}
                className="w-full"
                size="lg"
              >
                {scanning ? "Scanning..." : "Allow System Scan"}
              </Button>
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">System Specs</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  CPU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{specs.cpu.model}</p>
                <p className="text-sm text-muted-foreground">
                  {specs.cpu.cores} cores | {specs.cpu.architecture}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  GPU
                </CardTitle>
              </CardHeader>
              <CardContent>
                {specs.gpu.available ? (
                  <>
                    <p className="font-semibold">{specs.gpu.model}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">{specs.gpu.vendor}</Badge>
                      <Badge variant="secondary">{specs.gpu.vram}GB VRAM</Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No GPU detected</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{specs.ram.total}GB RAM</p>
                <p className="text-sm text-muted-foreground">
                  ~{specs.ram.available}GB available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{specs.disk.available}GB available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  OS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{specs.os.platform}</p>
                <p className="text-sm text-muted-foreground">{specs.os.version}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Docker
                </CardTitle>
              </CardHeader>
              <CardContent>
                {specs.docker.installed ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          specs.docker.running ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      />
                      <p className="font-semibold">
                        {specs.docker.running ? "Running" : "Installed (not running)"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      v{specs.docker.version}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <p className="text-destructive font-semibold">Not installed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep("chat")} size="lg">
              Continue to Requirements
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
