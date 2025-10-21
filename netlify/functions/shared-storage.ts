// Netlify Blobs with manual configuration
import { getStore } from '@netlify/blobs';

export interface UserAuth {
  slackUserId: string;
  dummyCorpUserId: string;
  accessToken: string;
  linkedAt: string;
}

// Get the Netlify Blobs store with manual config
const getUserStore = () => {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_TOKEN;
  
  console.log(`🔧 Blobs config - siteID: ${siteID ? 'present' : 'missing'}, token: ${token ? 'present' : 'missing'}`);
  
  if (!siteID || !token) {
    throw new Error('Missing Netlify Blobs configuration. Set NETLIFY_SITE_ID and NETLIFY_BLOBS_TOKEN in environment variables.');
  }
  
  return getStore({
    name: 'slack-users',
    siteID,
    token,
  });
};

// Helper functions
export async function isUserAuthenticated(slackUserId: string): Promise<boolean> {
  try {
    const store = getUserStore();
    const user = await store.get(slackUserId, { type: 'json' });
    const exists = user !== null;
    console.log(`🔍 Check auth for ${slackUserId}: ${exists}`);
    return exists;
  } catch (error) {
    console.error('Error checking auth:', error);
    return false;
  }
}

export async function getUserData(slackUserId: string): Promise<UserAuth | undefined> {
  try {
    const store = getUserStore();
    const user = await store.get(slackUserId, { type: 'json' });
    console.log(`📖 Read user data for ${slackUserId}:`, user ? 'found' : 'not found');
    return (user as UserAuth) || undefined;
  } catch (error) {
    console.error('Error getting user data:', error);
    return undefined;
  }
}

export async function linkUser(slackUserId: string, dummyCorpUserId: string, accessToken: string): Promise<void> {
  try {
    const store = getUserStore();
    const userData: UserAuth = {
      slackUserId,
      dummyCorpUserId,
      accessToken,
      linkedAt: new Date().toISOString(),
    };
    
    await store.setJSON(slackUserId, userData);
    console.log(`✅ Linked user: ${slackUserId} → ${dummyCorpUserId}`);
  } catch (error) {
    console.error('Error linking user:', error);
    throw error;
  }
}

export async function listAuthenticatedUsers(): Promise<string[]> {
  try {
    const store = getUserStore();
    const { blobs } = await store.list();
    const keys = blobs.map(b => b.key);
    console.log(`📊 Total authenticated users: ${keys.length}`);
    return keys;
  } catch (error) {
    console.error('Error listing users:', error);
    return [];
  }
}

// Event deduplication using Netlify Blobs
const getEventStore = () => {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_TOKEN;
  
  if (!siteID || !token) {
    throw new Error('Missing Netlify Blobs configuration');
  }
  
  return getStore({
    name: 'slack-events',
    siteID,
    token,
  });
};

export async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const store = getEventStore();
    const exists = await store.get(eventId);
    return exists !== null;
  } catch (error) {
    console.error('Error checking event:', error);
    return false;
  }
}

export async function markEventProcessed(eventId: string): Promise<void> {
  try {
    const store = getEventStore();
    // Store event with 1 hour expiry
    await store.set(eventId, 'processed', {
      metadata: { processedAt: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Error marking event:', error);
  }
}

