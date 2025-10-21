import { Handler } from '@netlify/functions';

// Simple login page
export const handler: Handler = async (event) => {
  const state = event.queryStringParameters?.state || '';
  
  // Return HTML login page
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DummyCorp - Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
      max-width: 400px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    p {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 14px;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .demo-hint {
      margin-top: 20px;
      padding: 15px;
      background: #f0f7ff;
      border-left: 4px solid #667eea;
      border-radius: 4px;
      font-size: 13px;
      color: #555;
    }
    .demo-hint strong {
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏢 DummyCorp Login</h1>
    <p>Link your Slack account with DummyCorp</p>
    
    <form action="/.netlify/functions/auth-callback" method="POST">
      <input type="hidden" name="state" value="${state}">
      
      <div class="form-group">
        <label for="username">Username or Email</label>
        <input type="text" id="username" name="username" required placeholder="john@company.com">
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required placeholder="Enter your password">
      </div>
      
      <button type="submit">🔐 Login & Authorize</button>
    </form>
    
    <div class="demo-hint">
      <strong>📝 Demo Mode:</strong> For this demo, any username/password will work. 
      In production, this would authenticate against your real user database.
    </div>
  </div>
</body>
</html>
  `;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: html,
  };
};

