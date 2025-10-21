import { Handler } from '@netlify/functions';
import { App, AwsLambdaReceiver } from '@slack/bolt';

// Initialize the receiver for AWS Lambda (works with Netlify Functions)
const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

// Initialize Bolt app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
  processBeforeResponse: true,
});

// ==================== IN-MEMORY USER STORAGE ====================
// In production, this would be a database
// For demo: stores user authentication state in memory
interface UserAuth {
  slackUserId: string;
  dummyCorpUserId: string;
  accessToken: string;
  linkedAt: string;
}

const authenticatedUsers = new Map<string, UserAuth>();

// ==================== HELPER FUNCTIONS ====================

function isUserAuthenticated(slackUserId: string): boolean {
  return authenticatedUsers.has(slackUserId);
}

function getAuthUrl(slackUserId: string): string {
  // Generate a state token for OAuth security
  const state = Buffer.from(JSON.stringify({ slackUserId, timestamp: Date.now() })).toString('base64');
  
  // This would be your DummyCorp OAuth server URL
  // For now, we'll create a simple auth endpoint
  const oauthUrl = `${process.env.NETLIFY_URL || 'https://slackdummy.netlify.app'}/auth/login?state=${state}`;
  
  return oauthUrl;
}

function linkUser(slackUserId: string, dummyCorpUserId: string, accessToken: string) {
  authenticatedUsers.set(slackUserId, {
    slackUserId,
    dummyCorpUserId,
    accessToken,
    linkedAt: new Date().toISOString(),
  });
  console.log(`✅ Linked user: ${slackUserId} → ${dummyCorpUserId}`);
}

function getUserData(slackUserId: string): UserAuth | undefined {
  return authenticatedUsers.get(slackUserId);
}

// ==================== BOT WITH AUTHENTICATION ====================

// Handle @mentions in channels - With Authentication Check
app.event('app_mention', async ({ event, say, client }) => {
  try {
    const userId = event.user;
    const text = event.text;
    const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();
    const threadTs = event.thread_ts || event.ts;

    console.log(`📨 Received from ${userId}: "${cleanText}"`);

    // Check if user is authenticated
    if (!isUserAuthenticated(userId)) {
      // User not authenticated - send OAuth link
      const authUrl = getAuthUrl(userId);
      
      await say({
        text: `👋 Hi! I need to link your Slack account with DummyCorp first.\n\nClick here to authenticate: ${authUrl}\n\n🔒 This is a secure one-time setup.`,
        thread_ts: threadTs,
      });
      return;
    }

    // User is authenticated - get their data
    const userData = getUserData(userId);
    
    // Echo back with personalized message
    await say({
      text: `✅ Authenticated as: ${userData?.dummyCorpUserId}\n\nYou said: "${cleanText}"`,
      thread_ts: threadTs,
    });

  } catch (error) {
    console.error('Error:', error);
    await say('Sorry, something went wrong! 😅');
  }
});

// Handle direct messages - Simple Echo
app.message(async ({ message, say }) => {
  // Only handle regular messages (not bot messages, no subtype)
  if (message.subtype || message.thread_ts) return;
  
  try {
    const text = (message as any).text;
    
    console.log(`💬 DM received: "${text}"`);

    // Echo back the message
    await say(text);

  } catch (error) {
    console.error('Error:', error);
  }
});

// ==================== NETLIFY HANDLER ====================

export const handler: Handler = async (event, context) => {
  // Handle AWS Lambda / Netlify Functions event
  const payload = {
    body: event.body!,
    headers: event.headers,
    isBase64Encoded: event.isBase64Encoded,
  };

  const result = await awsLambdaReceiver.start();
  return await result(payload as any, context as any, () => {});
};


