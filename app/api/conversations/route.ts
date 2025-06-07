import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id as number;

  // Fetch conversations for the user
  const convResult = await db.execute(
    'SELECT conversation_id, user1_id, user2_id, last_message_at FROM conversations WHERE user1_id = ? OR user2_id = ? ORDER BY last_message_at DESC',
    [userId, userId]
  );
  const convRows = convResult.rows as any[];

  const conversations = [] as any[];
  for (const conv of convRows) {
    const partnerId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
    // Get partner info
    const userRes = await db.execute(
      'SELECT user_id, first_name, last_name, profile_picture FROM users WHERE user_id = ?',
      [partnerId]
    );
    const partner = userRes.rows[0];
    // Count unread messages
    const unreadRes = await db.execute(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0 AND sender_id = ?',
      [userId, partnerId]
    );
    const unreadCount = (unreadRes.rows[0] as any).count as number;

    conversations.push({
      conversation_id: conv.conversation_id,
      partner,
      last_message_at: conv.last_message_at,
      unread_count: unreadCount,
    });
  }

  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUserId = session.user.id as number;
  const { partnerId } = (await req.json()) as { partnerId: number };
  if (!partnerId) {
    return NextResponse.json({ error: 'Missing partnerId' }, { status: 400 });
  }

  const user1 = Math.min(currentUserId, partnerId);
  const user2 = Math.max(currentUserId, partnerId);

  // Check if conversation exists
  const convRes = await db.execute(
    'SELECT conversation_id FROM conversations WHERE user1_id = ? AND user2_id = ?',
    [user1, user2]
  );

  let conversationId: number;
  if (convRes.rows.length === 0) {
    const insertRes = await db.execute(
      'INSERT INTO conversations (user1_id, user2_id, last_message_at) VALUES (?, ?, ?)',
      [user1, user2, new Date().toISOString()]
    );
    conversationId = Number(insertRes.lastInsertRowid);
  } else {
    conversationId = (convRes.rows[0] as any).conversation_id;
  }

  return NextResponse.json({ conversation_id: conversationId });
} 