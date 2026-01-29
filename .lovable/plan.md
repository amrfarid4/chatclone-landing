

# ChatGPT-Style Chat Interface Redesign

A complete overhaul to match the ChatGPT interface exactly, with dyne branding (teal accent) and restaurant-focused prompts.

---

## Major Changes Overview

| Current | New (ChatGPT-style) |
|---------|---------------------|
| Sidebar with conversation history | No sidebar - clean single column |
| Coral/terracotta accent color | Teal accent for dyne branding |
| User bubble: colored | User bubble: gray (#f4f4f4) |
| AI bubble: muted background | AI bubble: white with subtle border |
| No loading state | "Analyzing your data..." with pulsing dots |
| Generic prompts | Restaurant-focused prompts |

---

## Design Specifications

### Color Palette (Teal Dyne Branding)

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Primary (teal) | 173 80% 40% | 173 75% 45% |
| User bubble | Gray #f4f4f4 | Gray #2f2f2f |
| AI bubble | White with border | Dark with border |
| Background | Pure white | Near black |

### Layout Structure

```text
+------------------------------------------+
|                                          |
|                                          |
|     "What can I help you with?"          |
|                                          |
|    [Prompt 1]  [Prompt 2]  [Prompt 3]    |
|    [Prompt 4]  [Prompt 5]  [Prompt 6]    |
|                                          |
|                                          |
|  +------------------------------------+  |
|  | Message input...              [->] |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

### Restaurant Prompts (6 cards)

1. "Why is GMV down this week?" - Analyze your sales performance
2. "What's our best selling dish?" - Get menu insights
3. "Show peak hours" - Understand busy times
4. "Compare locations" - Multi-store analytics
5. "Customer feedback summary" - Review analysis
6. "Forecast tomorrow's orders" - Demand prediction

---

## Message Bubble Styling

### User Messages (right-aligned)

- Background: Gray (#f4f4f4 light / #374151 dark)
- Border radius: 24px
- No avatar icon
- Max width: 70%

### AI Messages (left-aligned)

- Background: White with 1px gray border
- Border radius: 24px
- Dyne logo/icon (teal circle)
- Max width: 85%

### Loading Indicator

- Text: "Analyzing your data..."
- Animation: Three pulsing dots
- Same positioning as AI message

---

## Technical Details

### Files to Modify

1. **src/index.css** - Update color tokens to teal palette
2. **src/data/mockData.ts** - Replace prompts with restaurant analytics
3. **src/components/chat/ChatInterface.tsx** - Remove sidebar, add loading state
4. **src/components/chat/MessageBubble.tsx** - Update bubble styles (gray/white+border)
5. **src/components/chat/WelcomeScreen.tsx** - Update heading, simplify layout
6. **src/components/chat/ChatInput.tsx** - Match ChatGPT input styling
7. **tailwind.config.ts** - Add new animation for loading dots

### New Component

- **LoadingIndicator.tsx** - Pulsing dots with "Analyzing your data..." text

### Loading State Flow

1. User sends message -> user message appears immediately
2. `isLoading` state set to true
3. Loading indicator shows (1.5-2 second delay simulated)
4. AI response appears with fade-in animation
5. Auto-scroll to show full response

### Animation Specifications

- Message fade-in: 200ms ease-out
- Loading dots: 1.4s infinite pulse (staggered by 0.2s each)
- Smooth scroll: CSS `scroll-behavior: smooth`

---

## Responsive Behavior

- Mobile: Full-width messages, larger touch targets
- Tablet/Desktop: Centered content (max-width: 768px)
- Input always fixed at bottom
- No hamburger menu (no sidebar to toggle)

