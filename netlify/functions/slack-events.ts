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

// ==================== USER STORAGE ====================
// WARNING: In-memory storage resets on every deployment/restart
// In production, this MUST be a database (PostgreSQL, Redis, etc.)
// For demo: Using a global Map that persists across function calls in same instance
interface UserAuth {
  slackUserId: string;
  dummyCorpUserId: string;
  accessToken: string;
  linkedAt: string;
}

// Global storage (persists within same Lambda/Netlify instance)
// @ts-ignore - Allow global variable
if (!global.authenticatedUsers) {
  // @ts-ignore
  global.authenticatedUsers = new Map<string, UserAuth>();
}

// @ts-ignore
const authenticatedUsers: Map<string, UserAuth> = global.authenticatedUsers;

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
    const channelId = event.channel;

    console.log(`📨 Received from ${userId}: "${cleanText}"`);

    // Check if user is authenticated
    if (!isUserAuthenticated(userId)) {
      // User not authenticated - send PRIVATE OAuth link (ephemeral message)
      // DON'T echo or respond publicly
      const authUrl = getAuthUrl(userId);
      
      // Send ephemeral message (only visible to this user)
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: `👋 Hi! I need to link your Slack account with DummyCorp first.\n\nClick here to authenticate: ${authUrl}\n\n🔒 This is a secure one-time setup that only you can see.`,
      });
      
      console.log(`⚠️ User ${userId} not authenticated - sent auth link`);
      return; // Don't echo anything publicly
    }

    // User is authenticated - get their data
    const userData = getUserData(userId);
    
    // Get last 3 messages from the conversation
    let conversationHistory = '';
    try {
      const history = await client.conversations.history({
        channel: channelId,
        limit: 4, // Get 4 to include current message
      });

      if (history.messages && history.messages.length > 0) {
        // Reverse to get chronological order and exclude the current bot mention
        const recentMessages = history.messages
          .reverse()
          .slice(-3); // Get last 3 messages

        // Format messages with user names (first name only)
        const formattedMessages = await Promise.all(
          recentMessages.map(async (msg: any) => {
            if (msg.user) {
              try {
                const userInfo = await client.users.info({ user: msg.user });
                // Get first name only
                const fullName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
                const firstName = fullName.split(' ')[0]; // Take first name only
                const msgText = msg.text?.replace(/<@[A-Z0-9]+>/g, '').trim() || '';
                return `${firstName}: ${msgText}`;
              } catch {
                return `User: ${msg.text || ''}`;
              }
            }
            return null;
          })
        );

        conversationHistory = formattedMessages.filter(m => m).join('\n');
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      conversationHistory = 'Could not fetch conversation history';
    }

    // Respond with authenticated user's name and conversation history
    await say({
      text: `✅ Authenticated as: *${userData?.dummyCorpUserId}*\n\n📝 *Last 3 messages:*\n${conversationHistory}`,
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


