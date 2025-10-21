// Simple file-based storage using JSONBin.io (free, no signup needed)
// For demo only - in production use a real database

export interface UserAuth {
  slackUserId: string;
  dummyCorpUserId: string;
  accessToken: string;
  linkedAt: string;
}

// Use a simple KV store - JSONBin.io free tier
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || 'demo-slack-users';
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || '$2a$10$demo-key';

async function readStorage(): Promise<Record<string, UserAuth>> {
  try {
    console.log(`📖 Reading storage from JSONBin...`);
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': JSONBIN_API_KEY,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const users = data.record || {};
      console.log(`✅ Loaded ${Object.keys(users).length} users from storage`);
      return users;
    } else {
      console.log(`⚠️ Storage not found, starting fresh`);
    }
  } catch (error) {
    console.error('Error reading storage:', error);
  }
  return {};
}

async function writeStorage(data: Record<string, UserAuth>): Promise<void> {
  try {
    console.log(`💾 Writing ${Object.keys(data).length} users to storage...`);
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY,
      },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      console.log(`✅ Storage updated successfully`);
    } else {
      console.error(`❌ Failed to update storage: ${response.status}`);
    }
  } catch (error) {
    console.error('Error writing storage:', error);
  }
}

// Helper functions
export async function isUserAuthenticated(slackUserId: string): Promise<boolean> {
  const users = await readStorage();
  const exists = slackUserId in users;
  console.log(`🔍 Check auth for ${slackUserId}: ${exists} (Total: ${Object.keys(users).length})`);
  return exists;
}

export async function getUserData(slackUserId: string): Promise<UserAuth | undefined> {
  const users = await readStorage();
  const user = users[slackUserId];
  console.log(`📖 Read user data for ${slackUserId}:`, user ? 'found' : 'not found');
  return user;
}

export async function linkUser(slackUserId: string, dummyCorpUserId: string, accessToken: string): Promise<void> {
  const users = await readStorage();
  
  users[slackUserId] = {
    slackUserId,
    dummyCorpUserId,
    accessToken,
    linkedAt: new Date().toISOString(),
  };
  
  await writeStorage(users);
  console.log(`✅ Linked user: ${slackUserId} → ${dummyCorpUserId} (Total: ${Object.keys(users).length})`);
}

export async function listAuthenticatedUsers(): Promise<string[]> {
  const users = await readStorage();
  const keys = Object.keys(users);
  console.log(`📊 Total authenticated users: ${keys.length}`);
  return keys;
}

