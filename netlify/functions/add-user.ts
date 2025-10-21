import { Handler } from '@netlify/functions';
import { linkUser } from './shared-storage';

export const handler: Handler = async (event) => {
  try {
    // Parse query parameters
    const slackUserId = event.queryStringParameters?.slackUserId;
    const username = event.queryStringParameters?.username;

    if (!slackUserId || !username) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Missing required parameters',
          usage: 'GET /add-user?slackUserId=U123&username=eli',
        }),
      };
    }

    // Generate a simple access token
    const accessToken = `token_${Buffer.from(`${username}_${Date.now()}`).toString('base64')}`;

    // Store the user
    await linkUser(slackUserId, username, accessToken);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'User added successfully',
        user: {
          slackUserId,
          dummyCorpUserId: username,
          accessToken,
        },
      }, null, 2),
    };
  } catch (error) {
    console.error('Error in add-user endpoint:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to add user',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

