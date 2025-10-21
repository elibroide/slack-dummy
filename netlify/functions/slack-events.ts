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

// ==================== ECHO BOT ====================

// Handle @mentions in channels - Simple Echo
app.event('app_mention', async ({ event, say }) => {
  try {
    // Remove the @Dummy mention from the text
    const text = event.text;
    const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

    console.log(`📨 Received: "${cleanText}"`);

    // Echo back the message
    await say({
      text: cleanText,
      thread_ts: event.thread_ts || event.ts, // Reply in thread if in thread
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


