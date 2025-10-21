# Storage Setup for DummyCorp Bot

The bot needs persistent storage that works across Netlify Functions. Here's how to set it up:

## Option 1: JSONBin.io (Recommended for Demo - 5 minutes)

1. **Go to https://jsonbin.io/**
2. **Click "Sign Up" (free)** - use your email
3. **Create a new bin:**
   - Click "Create Bin"
   - Name it: `slack-dummy-users`
   - Content: `{}`
   - Click "Create"
4. **Copy your credentials:**
   - Bin ID: Will look like `676abc123def456789`
   - API Key: Click your profile → API Keys → Copy

5. **Add to Netlify:**
   - Go to https://app.netlify.com/sites/slackdummy/configuration/env
   - Add environment variables:
     - `JSONBIN_BIN_ID` = `your-bin-id`
     - `JSONBIN_API_KEY` = `your-api-key`
   - Click "Deploy" to restart

## Option 2: Enable Netlify Blobs (Simpler but needs approval)

1. Go to https://app.netlify.com/sites/slackdummy/integrations
2. Find "Netlify Blobs" and click "Enable"
3. Done! (The code already supports it)

## Option 3: Use a Simple Database

For production, you'd use:
- PostgreSQL (Supabase, Neon)
- Redis (Upstash)
- DynamoDB

But for this demo, JSONBin is perfect!

