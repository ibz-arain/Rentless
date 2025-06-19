import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

interface StartConversationBody {
  propertyId: number;
  landlordId: number;
  content: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId, landlordId, content } = (await req.json()) as StartConversationBody;

  if (!propertyId || !landlordId || !content || !content.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const currentUserId = session.user.id as number;

  // Prevent landlord messaging themselves
  if (currentUserId === landlordId) {
    return NextResponse.json({ error: 'You cannot message your own property' }, { status: 400 });
  }

  // Check if a conversation already exists between these users for this property
  const convRes = await db.execute(
    'SELECT conversation_id FROM conversations WHERE property_id = ? AND tenant_id = ? AND landlord_id = ?',
    [propertyId, currentUserId, landlordId]
  );

  let conversationId: number;
  if (convRes.rows.length === 0) {
    // No conversation yet – create one now
    const now = new Date().toISOString();
    const insertConv = await db.execute(
      'INSERT INTO conversations (property_id, tenant_id, landlord_id, last_message_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [propertyId, currentUserId, landlordId, now, now]
    );
    conversationId = Number(insertConv.lastInsertRowid);
  } else {
    conversationId = (convRes.rows[0] as any).conversation_id as number;
  }

  // Insert the first message
  const insertMsg = await db.execute(
    'INSERT INTO messages (conversation_id, sender_id, content, sent_at, is_read) VALUES (?, ?, ?, ?, ?)',
    [conversationId, currentUserId, content, new Date().toISOString(), 0]
  );

  // Update conversation timestamp
  await db.execute(
    'UPDATE conversations SET last_message_at = ? WHERE conversation_id = ?',
    [new Date().toISOString(), conversationId]
  );

  const messageId = Number(insertMsg.lastInsertRowid);
  const msgRes = await db.execute(
    'SELECT message_id, sender_id, content, sent_at, is_read FROM messages WHERE message_id = ?',
    [messageId]
  );

  return NextResponse.json({
    conversation_id: conversationId,
    message: msgRes.rows[0],
  });
} 