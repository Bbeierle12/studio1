# AI Chat Assistant - Visual Guide

## Interface States

### 1. Closed State (Floating Button)
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                    ┌──┐ │
│                                    │💬│ │  ← Gradient button
│                                    │●│ │  ← Green pulse
│                                    └──┘ │
│                                  Bottom │
│                                   Right │
└─────────────────────────────────────────┘
```
- **Size**: 56px × 56px circular button
- **Colors**: Orange-to-pink gradient
- **Icon**: Message square (chat bubble)
- **Indicator**: Green pulse dot (top-right)
- **Hover**: Shows tooltip "Chat with AI Assistant"

---

### 2. Minimized State (Header Bar)
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                        ┌──────────────┐ │
│                        │🧑‍🍳 AI Assistant│ │
│                        │   [□] [×]    │ │
│                        └──────────────┘ │
│                                  Bottom │
│                                   Right │
└─────────────────────────────────────────┘
```
- **Size**: ~200px wide × 56px tall
- **Colors**: Gradient header (orange → pink)
- **Contents**: Chef icon, title, maximize/close buttons
- **Status**: Shows if speaking/listening with icon

---

### 3. Open State (Full Chat)
```
┌─────────────────────────────────────────┐
│                                         │
│                         ┌─────────────┐ │
│                         │🧑‍🍳 AI Cook  │ │
│                         │ Assistant   │ │
│                         │  [🔊] [_][×]│ │
│                         ├─────────────┤ │
│                         │🌤️ 72°F Sunny│ │  ← Weather bar
│                         ├─────────────┤ │
│                         │             │ │
│                         │ Hi! I'm your│ │  ← Assistant msg
│                         │ AI cooking  │ │
│                         │ assistant...│ │
│                         │             │ │
│                         │        What │ │  ← User msg
│                         │     can I   │ │
│                         │       cook? │ │
│                         │             │ │
│                         │ • • •       │ │  ← Typing...
│                         │             │ │
│                         ├─────────────┤ │
│                         │[Type...][🎤]│ │  ← Input area
│                         │         [→] │ │
│                         └─────────────┘ │
│                                  Bottom │
│                                   Right │
└─────────────────────────────────────────┘
```
- **Size**: 396px × 600px
- **Sections**:
  1. **Header**: Title + controls (audio, minimize, close)
  2. **Weather Bar**: Current conditions (optional)
  3. **Messages**: Scrollable chat history
  4. **Input**: Text field + voice button + send button

---

## Color Scheme

### Primary Colors
- **Gradient**: `from-orange-500 to-pink-500`
  - Orange: `#f97316`
  - Pink: `#ec4899`
- **Hover**: Darker shades (`orange-600`, `pink-600`)

### Message Colors
- **User Messages**: Gradient background (orange → pink), white text
- **Assistant Messages**: Muted background (gray), default text
- **Timestamps**: 70% opacity, extra small text

### Status Indicators
- **Online/Ready**: Green pulse (`bg-green-500`)
- **Listening**: Red pulse (`bg-red-500`)
- **Speaking**: Blue volume icon (`text-blue-500`)
- **Typing**: Gray bouncing dots (`bg-gray-400`)

---

## Interactions

### Opening the Chat
1. **Click floating button** → Chat opens in full view
2. Auto-focuses on input field
3. Shows welcome message

### Using Text Chat
1. **Type message** in input field
2. **Press Enter** or **click Send button** → Message sent
3. **AI responds** within 1-2 seconds
4. **Auto-scrolls** to latest message

### Using Voice Chat
1. **Click microphone button** → Starts listening
2. **Speak your question** → Transcribed to text
3. **Auto-submits** when done speaking
4. **AI responds** with text + voice (if audio enabled)

### Minimizing
1. **Click minimize button** (in header) → Collapses to header bar
2. **Click maximize** → Expands back to full view
3. Position maintained

### Closing
1. **Click X button** → Chat closes completely
2. **Returns to floating button** state
3. Chat history preserved (current session)

---

## Responsive Behavior

### Desktop (> 768px)
- Full 396px × 600px chat window
- All features visible
- Smooth animations

### Tablet (481-768px)
- Slightly narrower chat window
- All features maintained
- Adjusted margins

### Mobile (< 480px)
- Max width: `calc(100vw - 3rem)`
- Reduced height if needed
- Touch-optimized buttons
- Mobile keyboard aware

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Enter** | Send message |
| **Shift + Enter** | New line (not implemented yet) |
| **Esc** | Close/minimize chat (not implemented yet) |

---

## Animation Details

### Opening
- **Duration**: 300ms
- **Easing**: Ease-out
- **Effect**: Slide up + fade in

### Closing
- **Duration**: 200ms
- **Easing**: Ease-in
- **Effect**: Slide down + fade out

### Floating Button
- **Pulse**: Green dot continuous pulse (1s cycle)
- **Hover**: Scale up slightly (1.05x)
- **Click**: Ripple effect

### Messages
- **Appear**: Fade in (200ms)
- **Typing indicator**: Bounce animation (3 dots, staggered)
- **Scroll**: Smooth auto-scroll to bottom

---

## Accessibility Features

### ARIA Labels
- Button labels for screen readers
- Role attributes on chat elements
- Live regions for new messages

### Keyboard Navigation
- Tab through all interactive elements
- Enter to submit
- Focus indicators visible

### Visual Indicators
- High contrast text
- Clear button states
- Status icons with text labels

### Voice Features
- Optional (not required)
- Visual feedback when active
- Can be disabled entirely

---

## Technical Notes

### Component Location
`src/components/ai-chat-assistant.tsx`

### Used In
`src/components/header.tsx` (mounted globally when user logged in)

### Dependencies
```typescript
- @/components/ui/button
- @/components/ui/card
- @/components/ui/input
- @/components/ui/badge
- @/components/ui/scroll-area
- lucide-react (icons)
- @/lib/utils (cn helper)
```

### Browser APIs
- Web Speech API (SpeechRecognition)
- Web Speech API (SpeechSynthesis)
- Geolocation API (via weather prop)

---

## Comparison with Old Interface

| Feature | Old (Top-Left) | New (Bottom-Right) |
|---------|----------------|-------------------|
| Position | Fixed top-left | Fixed bottom-right |
| Size | Large (380px wide) | Compact (56px → 396px) |
| Always Visible | Yes (when enabled) | No (collapsible) |
| Primary Input | Voice | Text + Voice |
| Style | Card with border | Gradient bubble |
| Animation | Minimal | Smooth transitions |
| Mobile Friendly | Partially | Yes |
| Industry Standard | No | Yes (chat widget pattern) |

---

## Summary

The new AI Chat Assistant provides a modern, familiar interface that:
- ✅ Stays out of the way when not needed (bottom-right, collapsible)
- ✅ Easy to access when wanted (floating button always visible)
- ✅ Text-first approach (more comfortable for most users)
- ✅ Optional voice features (for hands-free cooking)
- ✅ Beautiful gradient design (matches cooking theme)
- ✅ Weather-aware suggestions (contextual help)
- ✅ Full chat history (see conversation flow)
- ✅ Responsive design (works on all devices)

The bottom-right positioning is the industry standard for chat interfaces (like Intercom, Drift, ChatBot, etc.) and users will immediately recognize and understand how to interact with it.
