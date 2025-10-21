# Storage Setup for DummyCorp Bot

The bot needs **Netlify Blobs** configured with environment variables.

## 🔧 Setup (2 minutes):

### 1. Get your Site ID
- Go to: https://app.netlify.com/sites/slackdummy/configuration/general
- Under **Project information**, copy the **Project ID** (this is your Site ID)
- Example: `a1b2c3d4-5678-90ab-cdef-1234567890ab`

### 2. Create a Personal Access Token
- Go to: https://app.netlify.com/user/applications#personal-access-tokens
- Click **New access token**
- Name it: `Slack Dummy Blobs`
- Click **Generate token**
- **Copy the token immediately** (you won't see it again)
- Example: `nfp_ABC123...xyz`

### 3. Add Environment Variables to Netlify
- Go to: https://app.netlify.com/sites/slackdummy/configuration/env
- Add these two variables:

| Variable Name | Value |
|---------------|-------|
| `NETLIFY_SITE_ID` | Your Project ID from step 1 |
| `NETLIFY_BLOBS_TOKEN` | Your token from step 2 |

- Click **Save**
- Then click **Deploy** button to trigger a redeploy

### 4. Wait for deployment (~1-2 minutes)

---

## 🧪 Test:

After deploy completes:

1. **Add a user**: https://slackdummy.netlify.app/.netlify/functions/add-user
2. **Check storage**: https://slackdummy.netlify.app/.netlify/functions/whois
3. **Should see the user!** ✅

---

## 📊 For Production

For Tipalti production, you'd use:
- PostgreSQL (Supabase, Neon)
- Redis (Upstash)
- Your existing Tipalti database

But for this demo, Netlify Blobs is perfect!

