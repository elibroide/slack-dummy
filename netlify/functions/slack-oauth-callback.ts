import { Handler } from '@netlify/functions';

// This handles Slack's OAuth installation flow
// When someone clicks "Add to Slack" or "Reinstall App"
export const handler: Handler = async (event) => {
  const code = event.queryStringParameters?.code;
  const error = event.queryStringParameters?.error;

  // If user denied the installation
  if (error) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Installation Cancelled</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Installation Cancelled</h1>
            <p>You cancelled the Slack app installation.</p>
            <p>You can try again anytime from the Slack App Directory.</p>
          </div>
        </body>
        </html>
      `,
    };
  }

  // If no code, something went wrong
  if (!code) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Installation Error</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Installation Error</h1>
            <p>No authorization code received from Slack.</p>
            <p>Please try installing the app again.</p>
          </div>
        </body>
        </html>
      `,
    };
  }

  // In a real app, you would:
  // 1. Exchange the code for an access token
  // 2. Store the token in your database
  // 3. Associate it with the workspace/team
  
  // For this demo, the app is already manually installed
  // So we just show a success message
  console.log(`✅ Slack OAuth callback received with code: ${code.substring(0, 10)}...`);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installation Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            background: white;
            padding: 50px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #28a745; margin-bottom: 20px; }
          p { color: #555; line-height: 1.6; }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: 600;
          }
          .button:hover { background: #5a67d8; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Installation Successful!</h1>
          <p><strong>Dummy</strong> has been installed to your Slack workspace.</p>
          <p>You can now use the bot by mentioning <code>@Dummy</code> in any channel or sending it a direct message.</p>
          <a href="slack://open" class="button">Open Slack</a>
        </div>
      </body>
      </html>
    `,
  };
};

