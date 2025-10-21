import { Handler } from '@netlify/functions';
import { WebClient } from '@slack/web-api';

// Initialize Slack client
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

// Shared storage module
import { linkUser, listAuthenticatedUsers } from './shared-storage';

// Helper to generate access token
function generateAccessToken(username: string): string {
  // In production, this would be a proper JWT or random secure token
  return `token_${Buffer.from(`${username}_${Date.now()}`).toString('base64')}`;
}

// Helper to send Slack message
async function notifySlackUser(userId: string, message: string) {
  try {
    await slackClient.chat.postMessage({
      channel: userId, // DM the user
      text: message,
    });
    console.log(`✅ Notified Slack user ${userId}: ${message}`);
  } catch (error) {
    console.error('Error notifying Slack user:', error);
  }
}

export const handler: Handler = async (event) => {
  try {
    // Parse form data
    const body = new URLSearchParams(event.body || '');
    const state = body.get('state');
    const username = body.get('username');
    const password = body.get('password');

    console.log('📝 Auth callback received:', { username, hasState: !!state });

    // Validate inputs
    if (!state || !username || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: sans-serif; padding: 40px; text-align: center; }
              .error { color: #e53e3e; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Error</h1>
            <p>Missing required fields. Please try again.</p>
            <a href="/.netlify/functions/auth-login">← Back to Login</a>
          </body>
          </html>
        `,
      };
    }

    // Decode state to get Slack user ID
    let slackUserId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      slackUserId = decoded.slackUserId;
      
      if (!slackUserId) {
        throw new Error('No Slack user ID in state');
      }
    } catch (error) {
      console.error('Error decoding state:', error);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: sans-serif; padding: 40px; text-align: center; }
              .error { color: #e53e3e; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Invalid State</h1>
            <p>Authentication link is invalid or expired.</p>
            <p>Please request a new link from the Slack bot.</p>
          </body>
          </html>
        `,
      };
    }

    // In production: Validate username/password against real database
    // For demo: Accept any non-empty credentials
    console.log(`🔐 Authenticating: ${username} for Slack user ${slackUserId}`);

    // Generate access token
    const accessToken = generateAccessToken(username);

    // Store the user mapping using shared storage
    await linkUser(slackUserId, username, accessToken);
    
    // Log all authenticated users for debugging
    const users = await listAuthenticatedUsers();
    console.log(`📊 All authenticated users: ${users.join(', ')}`);

    // Send success message to Slack
    await notifySlackUser(
      slackUserId,
      `✅ *Account Linked!*\n\nYour Slack account has been successfully linked to DummyCorp user: *${username}*\n\nYou can now use the bot to access your data. Try mentioning me with a command!`
    );

    // Show success page
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Success - DummyCorp</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              padding: 40px;
              max-width: 500px;
              width: 100%;
              text-align: center;
            }
            .success-icon {
              font-size: 64px;
              margin-bottom: 20px;
              animation: bounce 0.5s;
            }
            @keyframes bounce {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.2); }
            }
            h1 {
              color: #2d3748;
              margin-bottom: 10px;
              font-size: 28px;
            }
            p {
              color: #4a5568;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .user-info {
              background: #f7fafc;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              text-align: left;
              border-radius: 4px;
            }
            .user-info strong {
              color: #667eea;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin-top: 20px;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #718096;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Authentication Successful!</h1>
            <p>Your Slack account has been successfully linked to DummyCorp.</p>
            
            <div class="user-info">
              <strong>Linked Account:</strong><br>
              ${username}
            </div>
            
            <p>You can now return to Slack and start using the bot!</p>
            
            <a href="slack://open" class="button">← Return to Slack</a>
            
            <div class="footer">
              <p>🔒 This connection is secure and can be revoked anytime.<br>
              A confirmation message has been sent to you in Slack.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

  } catch (error) {
    console.error('❌ Auth callback error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: sans-serif; padding: 40px; text-align: center; }
            .error { color: #e53e3e; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Something went wrong</h1>
          <p>Please try again or contact support.</p>
        </body>
        </html>
      `,
    };
  }
};

