# Deploy DummyCorp Echo Bot to Netlify

## ✅ What's Already Done

- ✅ Project created and initialized
- ✅ Code written (simple echo bot)
- ✅ Git repository initialized
- ✅ All files committed
- ✅ Netlify CLI installed globally

## 🚀 Next Steps to Deploy

### Step 1: Restart Your Terminal/PowerShell

The Netlify CLI was just installed. You need to **restart your terminal** so it's in your PATH.

Close and reopen your terminal/PowerShell.

### Step 2: Navigate to Project

```bash
cd C:\Misc\Brainstorming\Slack\dummycorp-slack-bot
```

### Step 3: Login to Netlify

```bash
netlify login
```

This will open your browser. Sign in with Netlify (or create account if you don't have one).

### Step 4: Initialize Netlify Site

```bash
netlify init
```

Follow the prompts:
- **What would you like to do?** → Create & configure a new site
- **Team:** → Choose your team
- **Site name:** → `dummycorp-slack-bot` (or leave blank for random)
- **Build command:** → `npm run build`
- **Directory to deploy:** → (press Enter for default)
- **Netlify functions folder:** → `netlify/functions`

### Step 5: Set Environment Variables

```bash
netlify env:set SLACK_BOT_TOKEN "your-bot-token-here"
netlify env:set SLACK_SIGNING_SECRET "your-signing-secret-here"
```

**Get these values from**: `../Specs/dummy-app-credentials.md`

### Step 6: Deploy to Production

```bash
netlify deploy --prod
```

**SAVE THE URL!** You'll get something like:
```
Website URL: https://dummycorp-slack-bot.netlify.app
```

Your webhook will be:
```
https://dummycorp-slack-bot.netlify.app/slack/events
```

---

## 🔗 Configure Slack Events

Once deployed:

1. Go to https://api.slack.com/apps
2. Click on "Dummy" app
3. Click **"Event Subscriptions"** in sidebar
4. Toggle **"Enable Events"** to ON
5. **Request URL**: `https://your-site.netlify.app/slack/events`
6. Wait for "Verified ✓"
7. Scroll to **"Subscribe to bot events"**, add:
   - `app_mention`
   - `message.im`
   - `message.channels`
   - `message.groups`
8. Click **"Save Changes"**
9. Click **"Reinstall App"** if prompted

---

## 🎯 Test Your Bot!

In your Slack workspace:

```
You: @Dummy what is going on
Dummy: what is going on

You: @Dummy hello world
Dummy: hello world
```

Perfect echo bot! ✅

---

## 📁 Your Project Files

```
dummycorp-slack-bot/
├── netlify/
│   └── functions/
│       └── slack-events.ts    ← Main bot code (ECHO BOT)
├── .gitignore
├── netlify.toml               ← Netlify config
├── package.json               ← Dependencies
└── tsconfig.json              ← TypeScript config
```

---

## 🐛 Troubleshooting

### Can't run netlify command

**Solution**: Restart your terminal

### URL Verification Failed

**Solutions**:
- Make sure environment variables are set correctly
- Check Netlify function logs: `netlify functions:log slack-events`
- Verify the URL is exactly: `https://your-site.netlify.app/slack/events`

### Bot doesn't respond

**Check**:
1. Netlify deployment succeeded
2. Environment variables set in Netlify
3. Event subscriptions configured in Slack
4. Bot is installed in your workspace
5. You @mention the bot: `@Dummy test`

---

## 📝 What the Bot Does

**Current behavior**: Simple echo

```typescript
// Receives: @Dummy what is going on
// Returns: what is going on

// Receives: @Dummy hello world  
// Returns: hello world
```

To change behavior later, edit: `netlify/functions/slack-events.ts`

---

**Ready? Restart your terminal and run the deploy commands!** 🚀


