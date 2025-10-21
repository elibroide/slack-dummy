// Netlify Blobs - Zero-configuration persistent storage
// Works automatically with Netlify Functions - no setup needed!
import { getStore } from '@netlify/blobs';

export interface UserAuth {
  slackUserId: string;
  dummyCorpUserId: string;
  accessToken: string;
  linkedAt: string;
}

// Get the Netlify Blobs store (auto-configured)
const getUserStore = () => getStore('slack-users');

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

