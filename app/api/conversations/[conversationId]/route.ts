import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id as number;
  const conversationId = parseInt(params.conversationId, 10);

  if (isNaN(conversationId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  // Fetch a single conversation and ensure the user is part of it
  const convResult = await db.execute(
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
    WHERE c.conversation_id = ? AND (c.tenant_id = ? OR c.landlord_id = ?)`,
    [conversationId, userId, userId]
  );

  if (convResult.rows.length === 0) {
    return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
  }

  const conv = convResult.rows[0] as any;

  const partnerId = conv.tenant_id === userId ? conv.landlord_id : conv.tenant_id;
  
  // Get partner info
  const userRes = await db.execute(
    'SELECT user_id, first_name, last_name, profile_picture FROM users WHERE user_id = ?',
    [partnerId]
  );
  
  if (userRes.rows.length === 0) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
  }
  const partner = userRes.rows[0];

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

  const conversationData = {
    conversation_id: conv.conversation_id,
    landlord_id: conv.landlord_id,
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
  };

  return NextResponse.json(conversationData);
} 