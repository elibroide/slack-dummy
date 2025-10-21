import { Handler } from '@netlify/functions';
import { listAuthenticatedUsers, getUserData } from './shared-storage';

export const handler: Handler = async (event) => {
  try {
    // Get all authenticated user IDs
    const userIds = await listAuthenticatedUsers();
    
    // Get full data for each user
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const userData = await getUserData(userId);
        return userData;
      })
    );

    // Filter out any undefined values and return
    const authenticatedUsers = users.filter(u => u !== undefined);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        count: authenticatedUsers.length,
        users: authenticatedUsers,
      }, null, 2),
    };
  } catch (error) {
    console.error('Error in whois endpoint:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to retrieve authenticated users',
      }),
    };
  }
};

