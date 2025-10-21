import { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export const handler: Handler = async (event) => {
  try {
    const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_TOKEN;
    
    if (!siteID || !token) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing Netlify Blobs configuration',
        }),
      };
    }

    const store = getStore({
      name: 'slack-users',
      siteID,
      token,
    });

    // List all users
    const { blobs } = await store.list();
    const userCount = blobs.length;

    // Delete all users
    await Promise.all(blobs.map(blob => store.delete(blob.key)));

    console.log(`🗑️ Deleted ${userCount} users`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Deleted ${userCount} users`,
        deletedCount: userCount,
      }, null, 2),
    };
  } catch (error) {
    console.error('Error deleting users:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to delete users',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

