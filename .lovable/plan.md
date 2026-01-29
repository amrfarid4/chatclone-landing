

# Plan: Add "New Chat" Button and Persistent Prompt Access

## Overview
Currently, once you start a conversation, the suggested prompts disappear and the only way to see them again is to hard refresh the page. This plan adds two solutions:

1. **A "New Chat" button** - Clears the conversation and shows the welcome screen with prompts
2. **Quick prompt suggestions** - Compact prompt chips displayed above the input area during conversations

---

## What You'll Get

### Option A: New Chat Button (Recommended)
A button in the top-right corner that clears the current conversation and returns to the welcome screen with all 6 prompt suggestions.

### Option B: Persistent Prompt Chips
Small, clickable suggestion chips shown above the input area even during conversations, allowing quick access to common questions.

### Option C: Both (Best Experience)
Combines both approaches for maximum flexibility.

---

## Technical Details

### Files to Modify

**1. `src/components/chat/ChatInterface.tsx`**
- Add a `handleNewChat` function that clears the messages array
- Add a header section with a "New Chat" button
- Optionally add a `SuggestionChips` component above the input

**2. Create `src/components/chat/SuggestionChips.tsx`** (if using Option B or C)
- A compact horizontal row of clickable prompt buttons
- Smaller than the welcome screen cards, designed to fit above the input

### Implementation Approach

```text
┌─────────────────────────────────────────────┐
│ [dyne logo]              [+ New Chat]       │  ← Header with New Chat button
├─────────────────────────────────────────────┤
│                                             │
│           Chat Messages Area                │
│                                             │
├─────────────────────────────────────────────┤
│ [GMV?] [Top Items?] [Peak Hours?] [More...] │  ← Optional: Quick suggestion chips
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ Message dyne...                    [↑]  │ │  ← Input area
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### New Chat Button Behavior
- Clicking "New Chat" will:
  - Clear all messages from state
  - Show the welcome screen with all 6 prompts
  - Reset any loading states

### Suggestion Chips Behavior (Optional)
- Show 3-4 abbreviated prompts as small chips
- Clicking a chip sends that prompt immediately
- Chips can be hidden once conversation is active (configurable)

---

## Recommendation

I recommend **Option C (Both)** for the best user experience:
- The "New Chat" button provides a clear way to start fresh
- The suggestion chips offer quick access without losing context

However, if you prefer a simpler approach, **Option A (New Chat button only)** is clean and familiar from ChatGPT.

---

## Estimated Changes
- 1 new component (SuggestionChips) - if using chips
- Modify ChatInterface.tsx to add header and new chat logic
- Minor styling adjustments for the header layout

