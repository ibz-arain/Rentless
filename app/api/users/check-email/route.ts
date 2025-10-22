import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if email exists in database
    const userResult = await db.execute('SELECT email FROM users WHERE email = ?', [email]);

    return NextResponse.json({ 
      exists: userResult.rows.length > 0 
    }, { status: 200 });

  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
