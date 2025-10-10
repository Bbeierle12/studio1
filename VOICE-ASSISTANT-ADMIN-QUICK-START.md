# Voice Assistant Admin Settings - Quick Start Guide

## 🚀 Quick Access

**URL**: `/admin/settings`  
**Required Role**: Super Admin  
**Time to Configure**: 2-5 minutes

## 🎛️ Settings Overview

### Control Panel Layout

```
┌─────────────────────────────────────────────────────────────┐
│  System Settings                                             │
│  Configure voice assistant AI parameters and behavior        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🎤 Voice Assistant Configuration                            │
│  Adjust OpenAI API parameters for the cooking assistant      │
│                                                               │
│  🧠 Model                        [GPT-4 Turbo ▼]            │
│     GPT-4 Turbo provides the best responses                  │
│                                                               │
│  🌡️ Temperature                  0.70                        │
│     ├────────●──────────┤ (0.0 - 2.0)                       │
│     Controls randomness: Lower is focused, higher is creative│
│                                                               │
│  📝 Max Tokens                    500                        │
│     ├──────────●────────┤ (50 - 2000)                       │
│     Maximum length of the response                           │
│                                                               │
│  🎯 Top P                        1.00                        │
│     ├──────────────────●┤ (0.0 - 1.0)                       │
│     Alternative to temperature for diversity                 │
│                                                               │
│  🔁 Frequency Penalty            0.00                        │
│     ├──────────●────────┤ (-2.0 to 2.0)                     │
│     Reduces repetition of token sequences                    │
│                                                               │
│  ✨ Presence Penalty             0.00                        │
│     ├──────────●────────┤ (-2.0 to 2.0)                     │
│     Encourages talking about new topics                      │
│                                                               │
│  💬 Response Max Length          100 words                   │
│     ├──────●────────────┤ (50 - 300)                        │
│     Suggested word limit for voice responses                 │
│                                                               │
│  📋 System Prompt                                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ You are Chef Assistant, a helpful AI cooking         │  │
│  │ companion designed to help people while they cook.   │  │
│  │                                                       │  │
│  │ You are especially helpful when someone has dirty    │  │
│  │ hands and needs voice assistance...                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ℹ️ How These Settings Work                                 │
│     Temperature: 0.7 is balanced - good for cooking          │
│     Max Tokens: 500 is optimal for voice responses           │
│     Penalties: Keep at 0 for consistent cooking advice       │
│                                                               │
│  [💾 Save Settings]  [🔄 Reset to Defaults]                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## ⚙️ Parameter Cheat Sheet

| Parameter | Range | Default | Impact |
|-----------|-------|---------|--------|
| Temperature | 0.0-2.0 | 0.7 | Creativity level |
| Max Tokens | 50-2000 | 500 | Response length |
| Top P | 0.0-1.0 | 1.0 | Diversity control |
| Freq Penalty | -2.0-2.0 | 0.0 | Repetition reduction |
| Pres Penalty | -2.0-2.0 | 0.0 | Topic variety |

## 🎯 Common Configurations

### 1️⃣ Precise & Consistent (Food Safety)
```yaml
Temperature: 0.3
Top P: 0.8
Frequency Penalty: 0.1
Presence Penalty: 0.0
Use when: Food safety, temperatures, measurements
```

### 2️⃣ Balanced & Helpful (Default)
```yaml
Temperature: 0.7
Top P: 1.0
Frequency Penalty: 0.0
Presence Penalty: 0.0
Use when: General cooking questions
```

### 3️⃣ Creative & Varied (Recipe Ideas)
```yaml
Temperature: 0.9
Top P: 1.0
Frequency Penalty: 0.3
Presence Penalty: 0.3
Use when: Substitutions, meal planning
```

## 🧪 Testing Your Changes

### Step-by-Step Test Process

1. **Save your settings** in the admin panel
2. **Navigate to any recipe** (e.g., `/recipes/[recipeId]`)
3. **Click the microphone button** (bottom right)
4. **Ask a test question**: "What temperature should I cook chicken?"
5. **Listen to the response**
6. **Evaluate**:
   - Is it the right length?
   - Is it too creative or too boring?
   - Does it repeat itself?
7. **Adjust and repeat** until satisfied

### Good Test Questions

- "What temperature should I cook chicken breast?"
- "Can I substitute butter with oil?"
- "How do I know when pasta is done?"
- "What's the best way to chop onions?"
- "Tell me about different cooking oils"

## 📊 Parameter Effects Examples

### Temperature Effect

**Temperature: 0.2** (Focused)
> "Chicken breast should be cooked to 165°F internal temperature."

**Temperature: 0.7** (Balanced)
> "Chicken breast should reach 165°F internal temperature. I recommend using a meat thermometer for accuracy."

**Temperature: 1.2** (Creative)
> "For juicy chicken breast, aim for 165°F internal temperature. Pro tip: let it rest 5 minutes after cooking to redistribute the juices!"

### Max Tokens Effect

**Max Tokens: 200** (Concise)
> Short, direct answer (1-2 sentences)

**Max Tokens: 500** (Balanced)
> Comprehensive answer with tips (2-4 sentences)

**Max Tokens: 1000** (Detailed)
> Extensive explanation with multiple points

## 🔐 Security Notes

- ✅ Only Super Admins can access
- ✅ All changes are logged
- ✅ Settings validated before saving
- ✅ Audit trail maintained

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't access settings | Verify Super Admin role |
| Changes not saving | Check console for errors |
| Settings not applying | Wait 5 min for cache refresh |
| Responses too long | Reduce Max Tokens |
| Responses too boring | Increase Temperature |
| Too much repetition | Increase Frequency Penalty |

## 💡 Pro Tips

1. **Start with defaults** - Only change what you need
2. **Test incrementally** - Change one parameter at a time
3. **Document changes** - Note what works for your users
4. **Monitor feedback** - Adjust based on user experience
5. **Use reset** - Don't be afraid to start over

## 📱 Quick Actions

```bash
# Access settings page
Visit: http://localhost:3000/admin/settings

# Test voice assistant
1. Go to any recipe page
2. Click microphone icon
3. Ask a question
4. Evaluate response
```

## 🎓 Learning Resources

### Understanding Temperature
- **0.0-0.3**: Deterministic, consistent (math, facts)
- **0.4-0.7**: Balanced (general questions)
- **0.8-1.2**: Creative (ideas, suggestions)
- **1.3-2.0**: Very random (experimental only)

### Understanding Penalties
- **Frequency**: "Don't repeat exact phrases"
- **Presence**: "Talk about different topics"
- **Both at 0**: Natural conversation
- **Positive values**: More variety
- **Negative values**: More focused

## ✅ Checklist for First Use

- [ ] Login as Super Admin
- [ ] Navigate to `/admin/settings`
- [ ] Review default settings
- [ ] Make a small change (e.g., temperature to 0.8)
- [ ] Click "Save Settings"
- [ ] See success message
- [ ] Test voice assistant on recipe page
- [ ] Note the difference
- [ ] Try "Reset to Defaults"
- [ ] Test again to confirm reset

## 🎉 You're Ready!

The voice assistant admin settings are now at your fingertips. Start with small adjustments and work your way to the perfect configuration for your users.

**Happy Configuring! 🎛️**
