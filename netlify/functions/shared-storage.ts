// Shared storage module for both slack-events and auth-callback
// WARNING: This still uses in-memory storage which resets on cold starts
// For production, replace with a real database (Supabase, PostgreSQL, Redis)

export interface UserAuth {
  slackUserId: string;
  dummyCorpUserId: string;
  accessToken: string;
  linkedAt: string;
}

// Use global object to persist across function invocations in same instance
declare global {
  var __authenticatedUsers: Map<string, UserAuth> | undefined;
}

// Initialize global storage
if (!global.__authenticatedUsers) {
  global.__authenticatedUsers = new Map<string, UserAuth>();
  console.log('🗄️ Initialized global user storage');
}

export const authenticatedUsers = global.__authenticatedUsers;

// Helper functions
export function isUserAuthenticated(slackUserId: string): boolean {
  const exists = authenticatedUsers.has(slackUserId);
  console.log(`🔍 Check auth for ${slackUserId}: ${exists}`);
  return exists;
}

export function getUserData(slackUserId: string): UserAuth | undefined {
  return authenticatedUsers.get(slackUserId);
}

export function linkUser(slackUserId: string, dummyCorpUserId: string, accessToken: string) {
  authenticatedUsers.set(slackUserId, {
    slackUserId,
    dummyCorpUserId,
    accessToken,
    linkedAt: new Date().toISOString(),
  });
  console.log(`✅ Linked user: ${slackUserId} → ${dummyCorpUserId} (Total users: ${authenticatedUsers.size})`);
}

export function listAuthenticatedUsers(): string[] {
  return Array.from(authenticatedUsers.keys());
}

