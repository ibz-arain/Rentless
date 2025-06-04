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

  const baseQuery = `
      SELECT c.conversation_id, c.user1_id, c.user2_id, c.last_message_at,
             u.user_id as other_user_id, u.first_name, u.last_name, u.profile_picture,
             COALESCE(SUM(CASE WHEN m.is_read = 0 AND m.receiver_id = ? THEN 1 END),0) as unread_count,
             (
               SELECT content FROM messages m2
               WHERE m2.conversation_id = c.conversation_id
               ORDER BY m2.sent_at DESC LIMIT 1
             ) as last_message
      FROM conversations c
      JOIN users u ON (CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END) = u.user_id
      LEFT JOIN messages m ON m.conversation_id = c.conversation_id
      WHERE (c.user1_id = ? OR c.user2_id = ?)`;

  const args: any[] = [session.user.id, session.user.id, session.user.id, session.user.id];
  let query = baseQuery;
  if (conversationId) {
    query += ' AND c.conversation_id = ?';
    args.push(conversationId);
  }
  query += ' GROUP BY c.conversation_id ORDER BY c.last_message_at DESC';

  const result = await db.execute({ sql: query, args });

  return NextResponse.json(result.rows, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { userId } = body;
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const participants = [session.user.id, Number(userId)];
  participants.sort((a,b) => a-b);
  const existing = await db.execute({
    sql: `SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?`,
    args: [participants[0], participants[1]],
  });
  if (existing.rows.length > 0) {
    return NextResponse.json(existing.rows[0], { status: 200 });
  }

  const result = await db.execute({
    sql: `INSERT INTO conversations (user1_id, user2_id, last_message_at) VALUES (?, ?, CURRENT_TIMESTAMP)` ,
    args: [participants[0], participants[1]],
  });

  return NextResponse.json({ conversation_id: Number(result.lastInsertRowid) }, { status: 201 });
}
