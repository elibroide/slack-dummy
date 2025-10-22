import { Handler } from '@netlify/functions';
import { App, AwsLambdaReceiver } from '@slack/bolt';
import OpenAI from 'openai';

// Initialize OpenAI with no retries for faster feedback
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 0, // Disable automatic retries
});

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

// ==================== SHARED STORAGE ====================
import { isUserAuthenticated, getUserData, UserAuth, isEventProcessed, markEventProcessed } from './shared-storage';

// ==================== HELPER FUNCTIONS ====================

async function callChatGPT(userPrompt: string, conversationHistory: string, authenticatedUser: string, isDM: boolean = false): Promise<string> {
  try {
    const systemPrompt = isDM 
      ? `You are Dummy, a friendly AI assistant for DummyCorp integrated into Slack.

IMPORTANT - Conversation Style:
- You're having a natural, ongoing conversation with ${authenticatedUser}
- Remember the context of the entire conversation
- Be conversational, helpful, and engaging
- You can be playful and show personality
- Keep responses concise but informative
- Use natural language, not formal reports

IMPORTANT - Slack Formatting:
- Use *bold* for emphasis (single asterisks)
- Use _italic_ for emphasis (underscores)
- Use \`code\` for code snippets
- Keep responses readable and well-formatted
- Use emojis when appropriate to add personality

You have access to the full conversation history above. Use it to provide contextual responses.`
      : `You are Dummy, an AI assistant integrated into Slack for DummyCorp. You help users by analyzing conversations, answering questions, summarizing discussions, and providing insights.

IMPORTANT - Your Identity:
- Your name is "Dummy" (users refer to you as @Dummy in Slack)
- When users say "Dummy" or mention you, they are talking to/about YOU
- Respond naturally as yourself when addressed directly
- You are an AI assistant, not a person, but you have personality and can engage conversationally

Key capabilities:
- Analyze conversation context and respond intelligently
- Summarize discussions and extract action items
- Answer questions based on the conversation history
- Maintain a helpful, professional, and friendly tone

IMPORTANT - Slack Formatting:
- You are responding in Slack, so use Slack's markdown formatting
- Use *bold* for emphasis (asterisks, not double asterisks)
- Use _italic_ for emphasis (underscores)
- Use \`code\` for code snippets
- Use bullet points with • or -
- Keep responses concise and well-formatted
- Use line breaks for readability
- You can mention users with <@USER_ID> format if needed

The authenticated user is: ${authenticatedUser}`;

    console.log(`🤖 Calling ChatGPT (${isDM ? 'DM' : 'Channel'} mode):`, userPrompt);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory ? [{ role: 'system', content: `Previous conversation:\n${conversationHistory}` }] : []),
        { role: 'user', content: userPrompt },
      ],
      temperature: isDM ? 0.8 : 0.7,
      max_tokens: isDM ? 800 : 500,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    console.log('✅ ChatGPT response received');
    return response;
  } catch (error: any) {
    console.error('❌ ChatGPT error:', error);
    
    // Extract meaningful error message
    let errorMessage = 'Unknown error';
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return `❌ *Unable to contact AI*\n\nReason: ${errorMessage}\n\nPlease check:\n- OpenAI API key is configured correctly\n- You have sufficient API credits\n- Network connectivity is working`;
  }
}

function getAuthUrl(slackUserId: string, channelId: string, messageTs: string): string {
  // Generate a state token for OAuth security with channel/message context
  const state = Buffer.from(JSON.stringify({ 
    slackUserId, 
    channelId, 
    messageTs,
    timestamp: Date.now() 
  })).toString('base64');
  
  // This would be your DummyCorp OAuth server URL
  const oauthUrl = `${process.env.NETLIFY_URL || 'https://slackdummy.netlify.app'}/auth/login?state=${state}`;
  
  return oauthUrl;
}

// ==================== BOT WITH AUTHENTICATION ====================

// Handle @mentions in channels - With Authentication Check
app.event('app_mention', async ({ event, say, client }) => {
  try {
    // Deduplicate events using Netlify Blobs (persists across Lambda invocations)
    const eventId = `${event.ts}_${event.user}_${event.channel}`;
    
    if (await isEventProcessed(eventId)) {
      console.log(`⏭️ Skipping duplicate event: ${eventId}`);
      return;
    }
    
    // Mark event as processed immediately
    await markEventProcessed(eventId);
    
    const userId = event.user;
    const text = event.text;
    const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();
    const threadTs = event.thread_ts || event.ts;
    const channelId = event.channel;

    console.log(`📨 Received from ${userId}: "${cleanText}" [${eventId}]`);
    console.log(`🔑 Checking authentication for user ID: ${userId}`);

    // Check if user is authenticated
    const isAuthenticated = await isUserAuthenticated(userId);
    console.log(`🔐 Authentication result: ${isAuthenticated}`);
    
    if (!isAuthenticated) {
      // User not authenticated - send PRIVATE OAuth link (ephemeral message)
      // DON'T echo or respond publicly
      const authUrl = getAuthUrl(userId, channelId, event.ts);
      
      // Send ephemeral message with button (only visible to this user)
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: '👋 Hi! I need to link your Slack account with DummyCorp first.',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '👋 *Welcome to DummyCorp!*\n\nI need to link your Slack account with DummyCorp before I can help you.\n\n🔒 This is a secure one-time setup that only you can see.\n✨ After you authenticate, I\'ll automatically respond to your message!',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '🚀 Start Using Dummy!',
                  emoji: true,
                },
                url: authUrl,
                style: 'primary',
              },
            ],
          },
        ],
      });
      
      console.log(`⚠️ User ${userId} not authenticated - sent auth link`);
      return; // Don't echo anything publicly
    }

    // User is authenticated - get their data
    const userData = await getUserData(userId);
    
    // Get last 20 messages from the conversation for AI context
    let formattedHistory = '';
    try {
      const history = await client.conversations.history({
        channel: channelId,
        limit: 21, // Get 21 to include current message
      });

      if (history.messages && history.messages.length > 0) {
        // Reverse to get chronological order
        const recentMessages = history.messages.reverse().slice(0, 20);

        // Format messages with full details for GPT
        const formattedMessages = await Promise.all(
          recentMessages.map(async (msg: any) => {
            if (msg.user) {
              try {
                const userInfo = await client.users.info({ user: msg.user });
                const fullName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
                const timestamp = new Date(parseFloat(msg.ts) * 1000).toISOString();
                const msgText = msg.text || '';
                
                // Format as XML for GPT
                return `<message>
  <user name="${fullName}" id="${msg.user}" timestamp="${timestamp}">
${msgText}
  </user>
</message>`;
              } catch {
                return null;
              }
            }
            return null;
          })
        );

        formattedHistory = formattedMessages.filter(m => m).join('\n');
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      formattedHistory = 'Could not fetch conversation history';
    }

    // Send immediate "processing" message
    const processingMsg = await say({
      text: `⏳ Processing your request...`,
      thread_ts: threadTs,
    });

    // Call ChatGPT with the user's prompt and conversation history
    const gptResponse = await callChatGPT(
      cleanText || 'Summarize this conversation',
      formattedHistory,
      userData?.dummyCorpUserId || 'Unknown',
      false // Channel mode = analytical
    );

    // Update the processing message with the actual response
    await client.chat.update({
      channel: channelId,
      ts: processingMsg.ts!,
      text: `🤖 *AI Response for ${userData?.dummyCorpUserId}:*\n\n${gptResponse}`,
    });

  } catch (error) {
    console.error('Error:', error);
    await say('Sorry, something went wrong! 😅');
  }
});

// Handle interactive dropdown selection
app.action('favorite_food_select', async ({ ack, body, client }) => {
  // Acknowledge the action immediately
  await ack();
  
  try {
    const selectedValue = (body as any).actions[0].selected_option.value;
    const userId = body.user.id;
    
    console.log(`User ${userId} selected favorite food: ${selectedValue}`);
    
    // Send a follow-up message
    await client.chat.postMessage({
      channel: userId,
      text: `Great choice! 🎉 You selected: *${selectedValue}*`,
    });
    
    // TODO: Store this preference in your database
    // await updateUserPreference(userId, 'favorite_food', selectedValue);
    
  } catch (error) {
    console.error('Error handling favorite food selection:', error);
  }
});

// Handle direct messages (DMs) - Same logic as mentions
app.message(async ({ message, say, client }) => {
  try {
    // Only handle user messages in DMs (not bot messages, not channel messages)
    if (message.subtype || message.channel_type !== 'im') return;
    
    const msg = message as any;
    const userId = msg.user;
    const text = msg.text || '';
    const channelId = msg.channel;
    
    // Deduplicate events
    const eventId = `${msg.ts}_${userId}_${channelId}`;
    if (await isEventProcessed(eventId)) {
      console.log(`⏭️ Skipping duplicate DM: ${eventId}`);
      return;
    }
    await markEventProcessed(eventId);
    
    console.log(`💬 DM from ${userId}: "${text}"`);
    
    // Check authentication
    const isAuthenticated = await isUserAuthenticated(userId);
    
    if (!isAuthenticated) {
      const authUrl = getAuthUrl(userId, channelId, msg.ts);
      await say({
        text: '👋 Hi! I need to link your Slack account with DummyCorp first.',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '👋 *Welcome to DummyCorp!*\n\nI need to link your Slack account with DummyCorp before I can help you.\n\n🔒 This is a secure one-time setup.\n✨ After you authenticate, I\'ll automatically respond!',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '🚀 Start Using Dummy!',
                  emoji: true,
                },
                url: authUrl,
                style: 'primary',
              },
            ],
          },
        ],
      });
      return;
    }
    
    // User authenticated
    const userData = await getUserData(userId);
    
    console.log(`📤 Preparing response for DM channel: ${channelId}, user: ${userId}`);
    
    // For now, let's test without fetching history to isolate the issue
    // Get AI response
    const gptResponse = await callChatGPT(
      text || 'Hello',
      '', // No history for now - testing
      userData?.dummyCorpUserId || 'Unknown',
      true // DM mode = conversational
    );
    
    console.log(`✅ Got AI response, length: ${gptResponse.length}`);
    console.log(`📨 Sending to channel: ${channelId}`);
    
    // Use say() which should automatically use the right channel
    await say(gptResponse);
    
    console.log(`✅ Message sent successfully`);

  } catch (error) {
    console.error('DM Error:', error);
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


