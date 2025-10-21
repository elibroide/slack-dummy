import { Handler } from '@netlify/functions';
import { linkUser } from './shared-storage';

function generateRandomUser() {
  const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
  const names = ['alice', 'bob', 'charlie', 'diana', 'eli', 'frank', 'grace', 'henry'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  
  return {
    slackUserId: `U${randomId}`,
    username: `${randomName}_${randomId.substring(0, 4)}`,
  };
}

export const handler: Handler = async (event) => {
  try {
    // Parse query parameters or generate random data
    let slackUserId = event.queryStringParameters?.slackUserId;
    let username = event.queryStringParameters?.username;

    // If no parameters provided, generate random user
    if (!slackUserId || !username) {
      const randomUser = generateRandomUser();
      slackUserId = randomUser.slackUserId;
      username = randomUser.username;
      console.log(`🎲 Generated random user: ${slackUserId} → ${username}`);
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

