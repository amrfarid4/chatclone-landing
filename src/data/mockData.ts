import { Conversation, Message, SuggestedPrompt } from "@/types/chat";

export const suggestedPrompts: SuggestedPrompt[] = [
  {
    id: "1",
    title: "Why is GMV down this week?",
    description: "Analyze your sales performance",
    icon: "📉",
  },
  {
    id: "2",
    title: "Show me top selling items?",
    description: "Get menu insights",
    icon: "🍽️",
  },
  {
    id: "3",
    title: "Show peak hours",
    description: "Understand busy times",
    icon: "⏰",
  },
  {
    id: "4",
    title: "Compare locations",
    description: "Multi-store analytics",
    icon: "📊",
  },
  {
    id: "5",
    title: "Customer feedback summary",
    description: "Review analysis",
    icon: "💬",
  },
  {
    id: "6",
    title: "Forecast tomorrow's orders",
    description: "Demand prediction",
    icon: "🔮",
  },
];

const sampleCodeBlock = `\`\`\`typescript
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Example usage
console.log(fibonacci(10)); // Output: 55
\`\`\``;

export const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Understanding TypeScript generics",
    messages: [
      {
        id: "1-1",
        role: "user",
        content: "Can you explain TypeScript generics with a simple example?",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: "1-2",
        role: "assistant",
        content: `Of course! **TypeScript generics** allow you to write reusable, type-safe code that works with multiple types.

Here's a simple example:

${sampleCodeBlock}

### Key benefits:
1. **Type safety** - Catch errors at compile time
2. **Reusability** - One function works with many types
3. **IntelliSense** - Better IDE support

Would you like me to show more advanced patterns?`,
        timestamp: new Date(Date.now() - 3500000),
      },
    ],
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3500000),
  },
  {
    id: "2",
    title: "Creative writing: Space adventure",
    messages: [
      {
        id: "2-1",
        role: "user",
        content: "Write a short story about a space explorer discovering a new planet",
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        id: "2-2",
        role: "assistant",
        content: `# The Last Horizon

Captain Elena Voss pressed her palm against the cold viewport, her breath fogging the reinforced glass. After three years in the void, the planet before her seemed almost too beautiful to be real.

*Kepler-442b.* The nav computer had given it a sterile designation, but Elena had already named it in her heart: **Aurora**.

"Beginning descent," she whispered to no one, though the ship's AI recorded everything.

The atmosphere embraced her vessel like an old friend, streams of purple and gold dancing across the heat shields. And then she saw them—*the lights*. Not from cities, not from technology, but from the very ground itself.

Bioluminescence. An entire world that glowed.

Elena smiled, tears floating freely in the cabin's micro-gravity. 

"I found it," she said. "I finally found home."

---

*The End*

Would you like me to continue the story or write something different?`,
        timestamp: new Date(Date.now() - 86300000),
      },
    ],
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86300000),
  },
  {
    id: "3",
    title: "Recipe suggestions",
    messages: [],
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: "4",
    title: "Python debugging help",
    messages: [],
    createdAt: new Date(Date.now() - 259200000),
    updatedAt: new Date(Date.now() - 259200000),
  },
];
