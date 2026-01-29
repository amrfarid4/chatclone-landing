import { useState } from "react";
import { Check, Copy, User, Bot } from "lucide-react";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

function parseContent(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      elements.push(
        <TextContent key={`text-${lastIndex}`} content={content.slice(lastIndex, match.index)} />
      );
    }

    // Add code block
    const language = match[1] || "plaintext";
    const code = match[2].trim();
    elements.push(<CodeBlock key={`code-${match.index}`} code={code} language={language} />);

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    elements.push(<TextContent key={`text-${lastIndex}`} content={content.slice(lastIndex)} />);
  }

  return elements;
}

function TextContent({ content }: { content: string }) {
  // Simple markdown parsing for bold, italic, headers, and lists
  const lines = content.split("\n");

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="mt-4 mb-2 text-base font-semibold">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-4 mb-2 text-lg font-semibold">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="mt-4 mb-2 text-xl font-bold">
              {line.slice(2)}
            </h1>
          );
        }

        // Horizontal rule
        if (line.trim() === "---") {
          return <hr key={i} className="my-4 border-border" />;
        }

        // List items
        if (line.match(/^\d+\.\s/)) {
          return (
            <div key={i} className="ml-4 flex gap-2">
              <span className="text-primary font-medium">{line.match(/^\d+/)?.[0]}.</span>
              <span>{parseInlineFormatting(line.replace(/^\d+\.\s/, ""))}</span>
            </div>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="ml-4 flex gap-2">
              <span className="text-primary">•</span>
              <span>{parseInlineFormatting(line.slice(2))}</span>
            </div>
          );
        }

        // Empty line
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }

        // Regular paragraph
        return (
          <p key={i} className="leading-relaxed">
            {parseInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
}

function parseInlineFormatting(text: string): React.ReactNode {
  // Handle bold, italic, and inline code
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between bg-chat-code-bg px-4 py-2">
        <span className="text-xs font-medium text-chat-code-foreground/70">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-chat-code-foreground/70 hover:text-chat-code-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto bg-chat-code-bg p-4">
        <code className="text-sm font-mono text-chat-code-foreground">{code}</code>
      </pre>
    </div>
  );
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start",
        isLatest && "animate-fade-in"
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-chat-user-bubble text-chat-user-foreground"
            : "bg-chat-ai-bubble text-chat-ai-foreground"
        )}
      >
        {isUser ? (
          <p className="leading-relaxed">{message.content}</p>
        ) : (
          parseContent(message.content)
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
