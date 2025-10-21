// SIMPLE file-based storage - works in /tmp directory
// /tmp is shared across Lambda invocations in same container
import * as fs from 'fs';
import * as path from 'path';

export interface UserAuth {
  slackUserId: string;
  dummyCorpUserId: string;
  accessToken: string;
  linkedAt: string;
}

// Storage file path in /tmp
const STORAGE_FILE = '/tmp/slack-users.json';

// Read all users from file
function readStorage(): Record<string, UserAuth> {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading storage:', error);
  }
  return {};
}

// Write all users to file
function writeStorage(data: Record<string, UserAuth>) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`💾 Saved storage to ${STORAGE_FILE}`);
  } catch (error) {
    console.error('Error writing storage:', error);
  }
}

// Helper functions
export function isUserAuthenticated(slackUserId: string): boolean {
  const users = readStorage();
  const exists = slackUserId in users;
  console.log(`🔍 Check auth for ${slackUserId}: ${exists} (Total users: ${Object.keys(users).length})`);
  return exists;
}

export function getUserData(slackUserId: string): UserAuth | undefined {
  const users = readStorage();
  return users[slackUserId];
}

export function linkUser(slackUserId: string, dummyCorpUserId: string, accessToken: string) {
  const users = readStorage();
  users[slackUserId] = {
    slackUserId,
    dummyCorpUserId,
    accessToken,
    linkedAt: new Date().toISOString(),
  };
  writeStorage(users);
  console.log(`✅ Linked user: ${slackUserId} → ${dummyCorpUserId} (Total: ${Object.keys(users).length})`);
}

export function listAuthenticatedUsers(): string[] {
  const users = readStorage();
  return Object.keys(users);
}

