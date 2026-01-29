import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {isUser ? (
        // User message - right aligned, gray bubble, no avatar
        <div className="max-w-[70%]">
          <div className="rounded-3xl bg-chat-user-bubble px-4 py-3 text-chat-user-foreground">
            <MessageContent content={message.content} isUser={isUser} />
          </div>
        </div>
      ) : (
        // AI message - left aligned, white bubble with border, dyne logo
        <div className="flex items-start gap-3 max-w-[85%]">
          {/* Dyne logo - teal circle */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            D
          </div>
          
          <div className="rounded-3xl border border-chat-ai-border bg-chat-ai-bubble px-4 py-3 text-chat-ai-foreground">
            <MessageContent content={message.content} isUser={isUser} />
          </div>
        </div>
      )}
    </div>
  );
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  // Split content by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          return <CodeBlock key={index} content={part} />;
        }
        return <TextContent key={index} content={part} />;
      })}
    </div>
  );
}

function TextContent({ content }: { content: string }) {
  if (!content.trim()) return null;

  // Simple markdown parsing
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith("### ")) {
          return (
            <h3 key={index} className="font-semibold text-base mt-3">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} className="font-semibold text-lg mt-4">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={index} className="font-bold text-xl mt-4">
              {line.slice(2)}
            </h1>
          );
        }

        // Horizontal rule
        if (line.trim() === "---") {
          return <hr key={index} className="border-border my-4" />;
        }

        // List items
        if (line.match(/^\d+\.\s/)) {
          return (
            <p key={index} className="ml-4">
              <FormattedText text={line} />
            </p>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={index} className="ml-4">
              • <FormattedText text={line.slice(2)} />
            </p>
          );
        }

        // Regular paragraph
        if (line.trim()) {
          return (
            <p key={index}>
              <FormattedText text={line} />
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  // Parse bold, italic, and inline code
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return (
            <em key={index} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  // Extract language and code
  const match = content.match(/```(\w+)?\n?([\s\S]*?)```/);
  const language = match?.[1] || "text";
  const code = match?.[2]?.trim() || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-chat-code-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-chat-code-bg border-b border-muted/20">
        <span className="text-xs text-chat-code-foreground/60 font-mono">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-chat-code-foreground/60 hover:text-chat-code-foreground hover:bg-muted/20"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 mr-1" />
          ) : (
            <Copy className="h-3.5 w-3.5 mr-1" />
          )}
          <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>

      {/* Code */}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-chat-code-foreground leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
}
