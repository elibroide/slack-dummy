// Simple in-memory storage using global variable
// For demo purposes - in production use a real database

export interface UserAuth {
  slackUserId: string;
  dummyCorpUserId: string;
  accessToken: string;
  linkedAt: string;
}

// Declare global storage
declare global {
  var __slack_users: Record<string, UserAuth> | undefined;
}

// Initialize global storage
if (!global.__slack_users) {
  global.__slack_users = {};
  console.log('🗄️ Initialized global user storage');
}

// Helper functions
export async function isUserAuthenticated(slackUserId: string): Promise<boolean> {
  const exists = slackUserId in (global.__slack_users || {});
  console.log(`🔍 Check auth for ${slackUserId}: ${exists} (Total: ${Object.keys(global.__slack_users || {}).length})`);
  return exists;
}

export async function getUserData(slackUserId: string): Promise<UserAuth | undefined> {
  const user = global.__slack_users?.[slackUserId];
  console.log(`📖 Read user data for ${slackUserId}:`, user ? 'found' : 'not found');
  return user;
}

export async function linkUser(slackUserId: string, dummyCorpUserId: string, accessToken: string): Promise<void> {
  if (!global.__slack_users) {
    global.__slack_users = {};
  }
  
  global.__slack_users[slackUserId] = {
    slackUserId,
    dummyCorpUserId,
    accessToken,
    linkedAt: new Date().toISOString(),
  };
  
  console.log(`✅ Linked user: ${slackUserId} → ${dummyCorpUserId} (Total: ${Object.keys(global.__slack_users).length})`);
  console.log(`📦 Current storage:`, JSON.stringify(global.__slack_users, null, 2));
}

export async function listAuthenticatedUsers(): Promise<string[]> {
  const keys = Object.keys(global.__slack_users || {});
  console.log(`📊 Total authenticated users: ${keys.length}`);
  return keys;
}

