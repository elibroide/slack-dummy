# Deploy DummyCorp Bot via GitHub (No CLI Needed!)

**Problem**: Can't use `netlify` command due to path restrictions  
**Solution**: Deploy via GitHub → Netlify Web UI

---

## 🚀 Step-by-Step Deployment

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `dummycorp-slack-bot`
3. Make it **Private** (contains credentials later)
4. **Don't** initialize with README
5. Click **"Create repository"**

### Step 2: Push Your Code to GitHub

In your terminal (in the project folder):

```bash
cd C:\Misc\Brainstorming\Slack\dummycorp-slack-bot

# Add GitHub as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/dummycorp-slack-bot.git

# Push code
git branch -M main
git push -u origin main
```

### Step 3: Connect to Netlify (Web UI)

1. Go to https://app.netlify.com/
2. Sign up / Log in (free account)
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose **"GitHub"**
5. Authorize Netlify to access your GitHub
6. Select repository: `dummycorp-slack-bot`

### Step 4: Configure Build Settings

In Netlify's deploy configuration:

- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: (leave empty)
- **Functions directory**: `netlify/functions`

Click **"Deploy site"**

### Step 5: Add Environment Variables

After site is created:

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"** → **"Add a single variable"**

Add these two variables:

**Variable 1:**
- Key: `SLACK_BOT_TOKEN`
- Value: `[Get from ../Specs/dummy-app-credentials.md]`

**Variable 2:**
- Key: `SLACK_SIGNING_SECRET`
- Value: `[Get from ../Specs/dummy-app-credentials.md]`

3. Click **"Save"**

### Step 6: Redeploy with Environment Variables

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**

Wait for deployment to finish (~1-2 minutes)

### Step 7: Get Your URL

Once deployed:
1. On the site overview page, you'll see: **Site name** (e.g., `amazing-cupcake-123456`)
2. Your site URL will be: `https://amazing-cupcake-123456.netlify.app`
3. Your webhook URL is: `https://amazing-cupcake-123456.netlify.app/slack/events`

**COPY THIS URL!** You'll need it for Slack.

---

## 🔗 Configure Slack Events

Now that you have the webhook URL:

1. Go to https://api.slack.com/apps
2. Click on **"Dummy"** app
3. Click **"Event Subscriptions"** in left sidebar
4. Toggle **"Enable Events"** to **ON**
5. **Request URL**: Paste `https://your-site.netlify.app/slack/events`
6. Wait for **"Verified ✓"** (green checkmark)
7. Scroll down to **"Subscribe to bot events"**
8. Click **"Add Bot User Event"** and add:
   - `app_mention`
   - `message.im`
   - `message.channels`
   - `message.groups`
9. Click **"Save Changes"** at bottom
10. Slack will prompt: **"Reinstall your app"** → Click **"reinstall your app"**

---

## 🎯 Test Your Bot!

In your Slack workspace:

```
You: @Dummy what is going on
Dummy: what is going on

You: @Dummy hello world
Dummy: hello world
```

**It works!** ✅

---

## 🔄 Making Changes Later

When you want to update the bot:

1. Edit code locally
2. Commit changes:
   ```bash
   git add .
   git commit -m "Update bot"
   git push
   ```
3. Netlify will auto-deploy the changes!

---

## 🐛 Troubleshooting

### GitHub Push Asks for Password

Use a Personal Access Token instead:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scope: `repo`
4. Use token as password when pushing

### URL Verification Failed in Slack

**Check**:
1. Netlify site deployed successfully (green check)
2. Environment variables are set correctly in Netlify
3. URL is exactly: `https://your-site.netlify.app/slack/events` (with `/slack/events`)
4. Wait 30 seconds after adding env vars before verifying

**View logs**:
1. In Netlify → Functions tab
2. Click on `slack-events`
3. View real-time logs

### Bot Doesn't Respond

**Check**:
1. Event subscriptions are enabled and saved
2. Bot is installed in workspace (should see it in Apps list)
3. You're @mentioning it: `@Dummy test` (not just "Dummy test")
4. Check Netlify function logs for errors

---

## 📝 Summary

**No CLI needed!** You just:
1. ✅ Push code to GitHub
2. ✅ Connect GitHub to Netlify (web UI)
3. ✅ Add environment variables in Netlify
4. ✅ Configure Slack webhook URL
5. ✅ Test with `@Dummy`

**Ready? Start with Step 1: Create GitHub Repository!** 🚀

