import { db } from '@/lib/db';
import { formatPropertyData } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const propertyId = url.searchParams.get('propertyId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (propertyId) {
      const result = await db.execute({
        sql: 'SELECT 1 FROM favorites WHERE user_id = ? AND property_id = ?',
        args: [userId, propertyId],
      });
      const favorited = result.rows.length > 0;
      return NextResponse.json({ favorited }, { status: 200 });
    }

    const result = await db.execute({
      sql: `SELECT p.* FROM properties p JOIN favorites f ON p.property_id = f.property_id WHERE f.user_id = ?`,
      args: [userId],
    });

    const properties = result.rows.map(formatPropertyData);
    return NextResponse.json(properties, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { property_id } = body;
    if (!property_id) {
      return NextResponse.json({ error: 'property_id required' }, { status: 400 });
    }

    await db.execute({
      sql: 'INSERT OR IGNORE INTO favorites (user_id, property_id) VALUES (?, ?)',
      args: [session.user.id, property_id],
    });
    return NextResponse.json({ message: 'Favorited' }, { status: 201 });
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');
    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
    }

    await db.execute({
      sql: 'DELETE FROM favorites WHERE user_id = ? AND property_id = ?',
      args: [session.user.id, propertyId],
    });
    return NextResponse.json({ message: 'Unfavorited' }, { status: 200 });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
