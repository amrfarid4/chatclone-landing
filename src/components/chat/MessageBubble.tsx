import { Message, ActionCampaign } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Check, Copy, ArrowRight, Zap, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { submitCampaignAction, submitFeedback } from "@/lib/api";
import { DailyBriefCard } from "./reports/DailyBriefCard";
import { WeeklyScorecardCard } from "./reports/WeeklyScorecardCard";
import { CustomerIntelCard } from "./reports/CustomerIntelCard";
import { MessageActions } from "./MessageActions";
import { useStreamingText } from "@/hooks/useStreamingText";
import dyneEmblem from "@/assets/dyne-emblem.png";
import { parseResponse, hasVisualContent } from "@/lib/responseParser";
import {
  KPICardGrid,
  InlineBarChart,
  CollapsibleSection,
  InsightsList,
  MenuEngList,
  RecommendationsList,
} from "./VisualResponse";

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
  onSuggestedQuestion?: (question: string) => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  showSuggestions?: boolean;
}

export function MessageBubble({
  message,
  isLatest,
  onSuggestedQuestion,
  onRegenerate,
  onEdit,
  showSuggestions,
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isUser = message.role === "user";
  const suggestions = message.suggestedQuestions;
  const campaigns = message.actionCampaigns;
  const hasSuggestions = showSuggestions && !isUser && suggestions && suggestions.length > 0;
  const hasCampaigns = showSuggestions && !isUser && campaigns && campaigns.length > 0;

  // Streaming text effect for latest AI message
  const shouldStream = !isUser && isLatest && !message.reportType;
  const { displayedText, isComplete } = useStreamingText({
    text: message.content,
    enabled: shouldStream,
    speed: 20,
  });

  const contentToRender = shouldStream ? displayedText : message.content;

  return (
    <div
      className={cn(
        "flex animate-fade-in flex-col group",
        isUser ? "items-end" : "items-start"
      )}
      role="article"
      aria-label={`${isUser ? "You" : "Dyne"} said`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isUser ? (
        // User message - right aligned, gray bubble, no avatar
        <div className="max-w-[70%]">
          <div className="rounded-3xl bg-chat-user-bubble px-4 py-3 text-chat-user-foreground shadow-depth-1">
            <MessageContent content={contentToRender} isUser={isUser} />
          </div>
          {/* User message actions */}
          <MessageActions
            content={message.content}
            messageId={message.id}
            isUser={true}
            onEdit={onEdit}
            isVisible={isHovered}
            className="mt-1 justify-end"
          />
        </div>
      ) : (
        // AI message - left aligned, white bubble with border, dyne logo
        <div className="flex items-start gap-3 max-w-[85%]">
          {/* Dyne emblem */}
          <img
            src={dyneEmblem}
            alt="dyne"
            className="h-8 w-8 shrink-0 rounded-xl shadow-depth-1"
          />

          <div className="flex flex-col">
            <div className="rounded-3xl border border-chat-ai-border bg-chat-ai-bubble px-4 py-3 text-chat-ai-foreground shadow-depth-1">
              <MessageContent content={contentToRender} isUser={isUser} />
              {/* Streaming cursor */}
              {shouldStream && !isComplete && (
                <span className="inline-block w-0.5 h-4 bg-primary animate-cursor-blink ml-0.5 align-middle" />
              )}
            </div>
            {/* AI message actions */}
            {isComplete && (
              <MessageActions
                content={message.content}
                messageId={message.id}
                isUser={false}
                onRegenerate={onRegenerate}
                isVisible={isHovered}
                className="mt-1"
              />
            )}
            {/* Report Cards — staggered reveal */}
            {isComplete && message.reportType === "daily-brief" && message.reportData && (
              <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <DailyBriefCard data={message.reportData} />
              </div>
            )}
            {isComplete && message.reportType === "weekly-scorecard" && message.reportData && (
              <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <WeeklyScorecardCard data={message.reportData} />
              </div>
            )}
            {isComplete && message.reportType === "customer-intelligence" && message.reportData && (
              <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <CustomerIntelCard data={message.reportData} />
              </div>
            )}
            {/* Feedback buttons */}
            {isComplete && message.brainInteractionId && (
              <FeedbackButtons interactionId={message.brainInteractionId} />
            )}
          </div>
        </div>
      )}

      {/* Action Campaign Cards */}
      {hasCampaigns && (
        <div className="mt-3 ml-11 flex flex-col gap-2 animate-fade-in max-w-[75%]">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.campaign_id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Suggested follow-up questions — appear last */}
      {hasSuggestions && (
        <div className={cn("mt-3 ml-11 flex flex-wrap gap-2 opacity-0 animate-fade-in-up", hasCampaigns && "mt-2")} style={{ animationDelay: "1200ms" }}>
          {suggestions.map((question, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestedQuestion?.(question)}
              className="group flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
            >
              <ArrowRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              <span className="text-left">{question}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: ActionCampaign }) {
  const [status, setStatus] = useState<"idle" | "approved" | "rejected">("idle");
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "approved" | "rejected") => {
    setLoading(true);
    try {
      await submitCampaignAction(campaign.campaign_id, action);
      setStatus(action);
    } catch {
      setStatus(action); // Still show status even if API fails
    }
    setLoading(false);
  };

  const typeLabel = {
    bundle: "Bundle",
    discount: "Discount",
    promotion: "Promotion",
    slow_period: "Off-Peak Boost",
    menu_change: "Menu Change",
    pricing: "Pricing",
    retention: "Retention",
  }[campaign.trigger_type] || "Campaign";

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-primary">{typeLabel}</span>
        {campaign.confidence === "high" && (
          <span className="text-[10px] bg-success-muted text-success px-1.5 py-0.5 rounded-full">High confidence</span>
        )}
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">{campaign.description}</p>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {campaign.duration_days && <span>{campaign.duration_days} days</span>}
        {campaign.discount_pct && <span>{campaign.discount_pct}% off</span>}
        {campaign.estimated_impact_revenue && (
          <span>+{campaign.estimated_impact_revenue.toLocaleString()} EGP (projected)</span>
        )}
      </div>
      {status === "idle" ? (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs gap-1"
            onClick={() => handleAction("approved")}
            disabled={loading}
          >
            <ThumbsUp className="h-3 w-3" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => handleAction("rejected")}
            disabled={loading}
          >
            <ThumbsDown className="h-3 w-3" />
            Skip
          </Button>
        </div>
      ) : (
        <div className={cn(
          "text-xs font-medium pt-1",
          status === "approved" ? "text-success" : "text-muted-foreground"
        )}>
          {status === "approved" ? "Approved — queued for execution" : "Skipped"}
        </div>
      )}
    </div>
  );
}

function FeedbackButtons({ interactionId }: { interactionId: string }) {
  const [feedback, setFeedback] = useState<"none" | "thumbs_up" | "thumbs_down">("none");

  const handleFeedback = async (type: "thumbs_up" | "thumbs_down") => {
    setFeedback(type);
    try {
      await submitFeedback(interactionId, type);
    } catch {
      // Still show the selection even if API fails
    }
  };

  if (feedback !== "none") {
    return (
      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
        {feedback === "thumbs_up" ? (
          <><ThumbsUp className="h-3 w-3 text-primary" /> Thanks for the feedback</>
        ) : (
          <><ThumbsDown className="h-3 w-3 text-muted-foreground" /> Got it, we'll improve</>
        )}
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex items-center gap-1 opacity-0 animate-fade-in" style={{ animationDelay: "600ms" }}>
      <button
        onClick={() => handleFeedback("thumbs_up")}
        className="p-1 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors"
        title="Helpful"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => handleFeedback("thumbs_down")}
        className="p-1 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
        title="Not helpful"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  // Strip the "Want me to dig deeper?" section from displayed content
  // (questions are shown as buttons instead)
  const cleanContent = content.replace(/---\s*\n?\s*💡\s*\*?\*?Want me to dig deeper\?\*?\*?\s*\n?[\s\S]*$/, '').trim();

  // Parse response for visual components (AI messages only)
  const parsed = useMemo(() => {
    if (isUser) return null;
    return parseResponse(cleanContent);
  }, [cleanContent, isUser]);

  // Check if we have visual content to render
  const showVisual = parsed && hasVisualContent(parsed);

  // For AI messages with visual content, render structured components
  if (!isUser && showVisual) {
    return (
      <div className="space-y-4">
        {/* Headline - prominent */}
        {parsed.headline && (
          <h3 className="text-lg font-semibold text-foreground animate-slide-up-fade">
            {parsed.headline}
          </h3>
        )}

        {/* KPI Cards - metrics grid */}
        {parsed.kpiCards && parsed.kpiCards.length > 0 && (
          <KPICardGrid cards={parsed.kpiCards} className="mt-3" />
        )}

        {/* Bar Chart - for top items */}
        {parsed.chartData && parsed.chartData.length > 0 && (
          <div className="mt-3 opacity-0 animate-slide-up-fade" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
            <InlineBarChart data={parsed.chartData} title="Top Items" />
          </div>
        )}

        {/* Insights - collapsible bullet points */}
        {parsed.insights && parsed.insights.length > 0 && (
          <div className="mt-3 opacity-0 animate-slide-up-fade" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
            <CollapsibleSection
              title="What the data says"
              badge={`${parsed.insights.length} insights`}
              defaultOpen={true}
            >
              <InsightsList insights={parsed.insights} />
            </CollapsibleSection>
          </div>
        )}

        {/* Menu Engineering - category grid */}
        {parsed.menuEngineering && parsed.menuEngineering.length > 0 && (
          <div className="mt-3 opacity-0 animate-slide-up-fade" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
            <CollapsibleSection title="Menu Engineering" defaultOpen={true}>
              <MenuEngList menuEng={parsed.menuEngineering} />
            </CollapsibleSection>
          </div>
        )}

        {/* Recommendations - action items */}
        {parsed.recommendations && parsed.recommendations.length > 0 && (
          <div className="mt-3 opacity-0 animate-slide-up-fade" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
            <CollapsibleSection
              title="Recommendations"
              badge={`${parsed.recommendations.length} actions`}
              defaultOpen={true}
            >
              <RecommendationsList recommendations={parsed.recommendations} />
            </CollapsibleSection>
          </div>
        )}

        {/* Remaining unstructured text */}
        {parsed.rawText && (
          <div className="mt-3 opacity-0 animate-slide-up-fade" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
            <TextContent content={parsed.rawText} />
          </div>
        )}
      </div>
    );
  }

  // Default: render as markdown (user messages or AI without visual content)
  // Split content by code blocks
  const parts = cleanContent.split(/(```[\s\S]*?```)/g);

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

function MarkdownTable({ rows }: { rows: string[] }) {
  // Parse header, separator, and body rows
  const parseRow = (row: string) =>
    row.split("|").slice(1, -1).map((cell) => cell.trim());

  const header = parseRow(rows[0]);
  // rows[1] is the separator (| --- | --- |), skip it
  const body = rows.slice(2).map(parseRow);

  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted border-b border-border">
            {header.map((cell, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap"
              >
                <FormattedText text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? "bg-background" : "bg-muted/50"}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-1.5 text-muted-foreground whitespace-nowrap"
                >
                  <FormattedText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TextContent({ content }: { content: string }) {
  if (!content.trim()) return null;

  // Group lines into blocks: tables vs everything else
  const lines = content.split("\n");
  const blocks: { type: "text" | "table"; lines: string[] }[] = [];
  let i = 0;

  while (i < lines.length) {
    // Detect table: line starts with |, next line is separator (| --- |)
    if (
      lines[i].trim().startsWith("|") &&
      i + 1 < lines.length &&
      lines[i + 1].trim().match(/^\|[\s-:|]+\|$/)
    ) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "table", lines: tableLines });
    } else {
      // Collect non-table lines
      if (blocks.length === 0 || blocks[blocks.length - 1].type !== "text") {
        blocks.push({ type: "text", lines: [] });
      }
      blocks[blocks.length - 1].lines.push(lines[i]);
      i++;
    }
  }

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, bi) => {
        if (block.type === "table") {
          return <MarkdownTable key={bi} rows={block.lines} />;
        }
        return block.lines.map((line, li) => {
          const key = `${bi}-${li}`;
          // Headers
          if (line.startsWith("### ")) {
            return (
              <h3 key={key} className="font-semibold text-base mt-3">
                <FormattedText text={line.slice(4)} />
              </h3>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={key} className="font-semibold text-lg mt-4">
                <FormattedText text={line.slice(3)} />
              </h2>
            );
          }
          if (line.startsWith("# ")) {
            return (
              <h1 key={key} className="font-bold text-xl mt-4">
                <FormattedText text={line.slice(2)} />
              </h1>
            );
          }

          // Horizontal rule
          if (line.trim() === "---") {
            return <hr key={key} className="border-border my-4" />;
          }

          // List items
          if (line.match(/^\d+\.\s/)) {
            return (
              <p key={key} className="ml-4">
                <FormattedText text={line} />
              </p>
            );
          }
          if (line.startsWith("- ")) {
            return (
              <p key={key} className="ml-4">
                • <FormattedText text={line.slice(2)} />
              </p>
            );
          }

          // Regular paragraph
          if (line.trim()) {
            return (
              <p key={key}>
                <FormattedText text={line} />
              </p>
            );
          }

          return null;
        });
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
