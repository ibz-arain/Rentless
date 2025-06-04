import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const conversationId = url.searchParams.get('conversationId');
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
  }

  const check = await db.execute({
    sql: 'SELECT user1_id, user2_id FROM conversations WHERE conversation_id = ?',
    args: [conversationId],
  });
  if (!check.rows.length || (check.rows[0].user1_id !== session.user.id && check.rows[0].user2_id !== session.user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC',
    args: [conversationId],
  });
  return NextResponse.json(result.rows, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { conversation_id, receiver_id, content } = await req.json();
  if (!conversation_id || !receiver_id || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const conv = await db.execute({
    sql: 'SELECT user1_id, user2_id FROM conversations WHERE conversation_id = ?',
    args: [conversation_id],
  });
  if (!conv.rows.length || (conv.rows[0].user1_id !== session.user.id && conv.rows[0].user2_id !== session.user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await db.execute({
    sql: 'INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
    args: [conversation_id, session.user.id, receiver_id, content],
  });

  await db.execute({
    sql: 'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE conversation_id = ?',
    args: [conversation_id],
  });

  return NextResponse.json({ message_id: Number(result.lastInsertRowid) }, { status: 201 });
}
