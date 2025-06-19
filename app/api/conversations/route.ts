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

  const search = req.nextUrl.searchParams.get('search');

  let convResult;

  if (search && typeof search === 'string' && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    convResult = await db.execute({
      sql: `
        SELECT DISTINCT
          c.conversation_id, c.property_id, c.tenant_id, c.landlord_id, c.last_message_at,
          p.title, p.address, p.images, p.monthly_rent, p.bedrooms, p.bathrooms
        FROM conversations c
        INNER JOIN properties p ON c.property_id = p.property_id
        INNER JOIN users partner ON partner.user_id = (
          CASE
            WHEN c.tenant_id = ? THEN c.landlord_id
            ELSE c.tenant_id
          END
        )
        LEFT JOIN messages m ON m.conversation_id = c.conversation_id
        WHERE (c.tenant_id = ? OR c.landlord_id = ?)
        AND (
          (partner.first_name || ' ' || partner.last_name) LIKE ?
          OR p.title LIKE ?
          OR m.content LIKE ?
        )
        ORDER BY c.last_message_at DESC
      `,
      args: [userId, userId, userId, searchTerm, searchTerm, searchTerm],
    });
  } else {
    // Fetch conversations for the user (both as tenant and landlord)
    convResult = await db.execute(
      `SELECT 
      c.conversation_id,
      c.property_id,
      c.tenant_id,
      c.landlord_id,
      c.last_message_at,
      p.title,
      p.address,
      p.images,
      p.monthly_rent,
      p.bedrooms,
      p.bathrooms
    FROM conversations c
    JOIN properties p ON c.property_id = p.property_id
    WHERE c.tenant_id = ? OR c.landlord_id = ?
    ORDER BY c.last_message_at DESC`,
      [userId, userId]
    );
  }

  const convRows = convResult.rows as any[];

  const conversations = [] as any[];
  for (const conv of convRows) {
    const partnerId = conv.tenant_id === userId ? conv.landlord_id : conv.tenant_id;
    
    // Get partner info
    const userRes = await db.execute(
      'SELECT user_id, first_name, last_name, profile_picture FROM users WHERE user_id = ?',
      [partnerId]
    );
    const partner = userRes.rows[0];

    // Count unread messages
    const unreadRes = await db.execute(
      'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ? AND sender_id = ? AND is_read = 0',
      [conv.conversation_id, partnerId]
    );
    const unreadCount = (unreadRes.rows[0] as any).count as number;

    // Fetch last message content (limit 1)
    const lastMsgRes = await db.execute(
      'SELECT content FROM messages WHERE conversation_id = ? ORDER BY sent_at DESC LIMIT 1',
      [conv.conversation_id]
    );
    const lastMessageContent = lastMsgRes.rows.length > 0 ? (lastMsgRes.rows[0] as any).content as string : null;

    // Parse images if they're stored as JSON string
    let images = conv.images;
    try {
      if (typeof images === 'string') {
        images = JSON.parse(images);
      }
    } catch (e) {
      console.error('Error parsing images:', e);
      images = null;
    }

    conversations.push({
      conversation_id: conv.conversation_id,
      property: {
        property_id: conv.property_id,
        title: conv.title,
        address: conv.address,
        images: images,
        monthly_rent: conv.monthly_rent,
        bedrooms: conv.bedrooms,
        bathrooms: conv.bathrooms
      },
      partner,
      last_message_at: conv.last_message_at,
      last_message: lastMessageContent,
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
  const { propertyId, landlordId } = (await req.json()) as { propertyId: number; landlordId: number };
  
  if (!propertyId || !landlordId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check if user is trying to message their own property
  if (currentUserId === landlordId) {
    return NextResponse.json({ error: 'You cannot message your own property' }, { status: 400 });
  }

  // Check if conversation exists
  const convRes = await db.execute(
    'SELECT conversation_id FROM conversations WHERE property_id = ? AND tenant_id = ? AND landlord_id = ?',
    [propertyId, currentUserId, landlordId]
  );

  let conversationId: number;
  if (convRes.rows.length === 0) {
    const insertRes = await db.execute(
      'INSERT INTO conversations (property_id, tenant_id, landlord_id, last_message_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [propertyId, currentUserId, landlordId, new Date().toISOString(), new Date().toISOString()]
    );
    conversationId = Number(insertRes.lastInsertRowid);
  } else {
    conversationId = (convRes.rows[0] as any).conversation_id;
  }

  return NextResponse.json({ conversation_id: conversationId });
} 