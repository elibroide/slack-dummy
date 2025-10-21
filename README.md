# DummyCorp Slack Bot

Simple echo bot for Slack - responds to @mentions by echoing back what you say.

## What It Does

```
You: @Dummy what is going on
Bot: what is going on

You: @Dummy hello world  
Bot: hello world
```

## Tech Stack

- **Node.js** + **TypeScript**
- **Slack Bolt SDK** for Slack integration
- **Netlify Functions** for serverless hosting

## Deployment

See `DEPLOY-VIA-GITHUB.md` for full deployment instructions.

### Quick Deploy

1. Push to GitHub
2. Connect to Netlify via web UI
3. Add environment variables
4. Configure Slack Event Subscriptions

## Environment Variables

Required in Netlify:
- `SLACK_BOT_TOKEN` - Bot OAuth token from Slack
- `SLACK_SIGNING_SECRET` - Signing secret from Slack

## Project Structure

```
dummycorp-slack-bot/
├── netlify/
│   └── functions/
│       └── slack-events.ts    # Main bot logic
├── netlify.toml               # Netlify configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Local Development

Not applicable - this bot uses Netlify Functions which require deployment to test with Slack's webhooks.

## Making Changes

1. Edit `netlify/functions/slack-events.ts`
2. Commit and push to GitHub
3. Netlify auto-deploys

## Current Features

- ✅ Responds to @mentions in channels
- ✅ Responds to direct messages
- ✅ Works in threads

## Future Enhancements

- [ ] Context awareness (conversation history)
- [ ] API integration (call DummyCorp services)
- [ ] AI integration (Claude/ChatGPT)
- [ ] User authentication
- [ ] Channel access detection

