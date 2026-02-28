"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWizardStore } from "@/frontend/store/wizard";
import { ModelRecommendation } from "@/shared/types";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Badge } from "@/frontend/components/ui/badge";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function parseRecommendation(text: string): ModelRecommendation | null {
  const match = text.match(
    /---RECOMMENDATION---\s*([\s\S]*?)\s*---END_RECOMMENDATION---/
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function cleanMessage(text: string): string {
  return text
    .replace(/---RECOMMENDATION---[\s\S]*?---END_RECOMMENDATION---/, "")
    .trim();
}

export function ChatPage() {
  const {
    specs,
    recommendation,
    setRecommendation,
    setStep,
    setDeploymentConfig,
    setGuardrailPrompt,
  } = useWizardStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasSentInitial = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Send an initial greeting from the agent when the page loads
  useEffect(() => {
    if (hasSentInitial.current) return;
    hasSentInitial.current = true;

    const sendInitialMessage = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content:
                  "Introduce yourself briefly and ask me what I want to build. Keep it to 2-3 sentences.",
              },
            ],
            specs,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Agent request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let content = "";
        const msgId = Date.now().toString();

        setMessages([{ id: msgId, role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
          setMessages([{ id: msgId, role: "assistant", content }]);
        }
      } catch {
        setMessages([
          {
            id: Date.now().toString(),
            role: "assistant",
            content:
              "Hi! I'm your LLMforAll deployment agent. Tell me what you'd like to build and I'll find the perfect model for your hardware.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    sendInitialMessage();
  }, [specs]);

  const checkForRecommendation = useCallback(() => {
    for (const msg of messages) {
      if (msg.role === "assistant") {
        const rec = parseRecommendation(msg.content);
        if (rec && !recommendation) {
          setRecommendation(rec);
          setDeploymentConfig({
            framework: rec.framework,
            modelId: rec.modelId,
            port: rec.framework === "vllm" ? 8000 : 11434,
            guardrailPrompt: "",
            gpuEnabled: specs?.gpu.available ?? false,
            maxModelLen: rec.contextWindow,
            quantization: rec.quantization,
          });
        }
      }
    }
  }, [messages, recommendation, setRecommendation, setDeploymentConfig, specs]);

  useEffect(() => {
    checkForRecommendation();
  }, [checkForRecommendation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          specs,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Agent request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // The text stream response sends plain text chunks
        assistantContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            id: assistantId,
            role: "assistant",
            content: assistantContent,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content:
            "Sorry, I could not connect to the agent. Please check your API configuration.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = () => {
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    if (
      conversationText.toLowerCase().includes("guardrail") ||
      conversationText.toLowerCase().includes("restrict") ||
      conversationText.toLowerCase().includes("should not")
    ) {
      setGuardrailPrompt(
        `Based on user requirements from deployment conversation. The model should follow all restrictions discussed during setup.`
      );
    }

    setStep("deploy");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 h-[calc(100vh-60px)] flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Tell us what you need</h2>
        <p className="text-sm text-muted-foreground">
          Chat with our AI agent. It will understand your requirements and
          recommend the perfect setup.
        </p>
      </div>

      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {cleanMessage(msg.content)}
                </p>
              </div>
            </div>
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Thinking...
                  </p>
                </div>
              </div>
            )}
        </div>
      </ScrollArea>

      {recommendation && (
        <Card className="mb-4 border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Recommendation
              <Badge variant="secondary">{recommendation.framework}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Model:</span>{" "}
                <span className="font-medium">
                  {recommendation.modelName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Params:</span>{" "}
                <span className="font-medium">
                  {recommendation.parameters}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Quantization:</span>{" "}
                <span className="font-medium">
                  {recommendation.quantization}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">VRAM:</span>{" "}
                <span className="font-medium">
                  {recommendation.vramRequired}GB
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Speed:</span>{" "}
                <span className="font-medium">
                  {recommendation.estimatedSpeed}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Context:</span>{" "}
                <span className="font-medium">
                  {recommendation.contextWindow}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {recommendation.reasoning}
            </p>
            <Button onClick={handleDeploy} className="w-full mt-3" size="lg">
              Deploy Now
            </Button>
          </CardContent>
        </Card>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you want to build..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
