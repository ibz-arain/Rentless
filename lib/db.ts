import { createClient } from '@libsql/client';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) throw new Error('TURSO_DATABASE_URL is not defined');

export const db = createClient({
  url: tursoUrl,
  ...(tursoAuthToken && { authToken: tursoAuthToken }),
}); 