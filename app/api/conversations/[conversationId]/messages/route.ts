import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(req: NextRequest, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { conversationId } = await params;
  const convId = parseInt(conversationId, 10);
  if (isNaN(convId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  // Validate conversation membership
  const convRes = await db.execute(
    'SELECT user1_id, user2_id FROM conversations WHERE conversation_id = ?',
    [convId]
  );
  if (convRes.rows.length === 0) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }
  const { user1_id, user2_id } = convRes.rows[0] as any;
  if (session.user.id !== user1_id && session.user.id !== user2_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch messages
  const msgsRes = await db.execute(
    'SELECT message_id, sender_id, receiver_id, content, sent_at, is_read FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY sent_at ASC',
    [user1_id, user2_id, user2_id, user1_id]
  );
  const messages = msgsRes.rows as any[];

  // Mark messages as read for this user
  const partnerId = session.user.id === user1_id ? user2_id : user1_id;
  await db.execute(
    'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0',
    [session.user.id, partnerId]
  );

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: any }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { conversationId } = await params;
  const convId = parseInt(conversationId, 10);
  if (isNaN(convId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  // Validate conversation membership
  const convRes = await db.execute(
    'SELECT user1_id, user2_id FROM conversations WHERE conversation_id = ?',
    [convId]
  );
  if (convRes.rows.length === 0) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }
  const { user1_id, user2_id } = convRes.rows[0] as any;
  if (session.user.id !== user1_id && session.user.id !== user2_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content } = (await req.json()) as { content: string };
  if (!content) {
    return NextResponse.json({ error: 'Missing content' }, { status: 400 });
  }
  const partnerId = session.user.id === user1_id ? user2_id : user1_id;

  // Insert message
  const insertRes = await db.execute(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
    [session.user.id, partnerId, content]
  );

  // Update conversation timestamp
  await db.execute(
    'UPDATE conversations SET last_message_at = ? WHERE conversation_id = ?',
    [new Date().toISOString(), convId]
  );

  // Return the newly created message
  const messageId = Number(insertRes.lastInsertRowid);
  const msgRes = await db.execute(
    'SELECT message_id, sender_id, receiver_id, content, sent_at, is_read FROM messages WHERE message_id = ?',
    [messageId]
  );
  const messageRow = msgRes.rows[0] as any;
  // Include the conversation ID so the Socket.IO server can broadcast to the correct room
  return NextResponse.json({ ...messageRow, conversation_id: convId });
} 