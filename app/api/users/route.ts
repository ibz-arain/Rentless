import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db'; // Assuming db is configured and exported from here
import { CreateUserPayload, User } from '@/lib/types'; // Assuming your types are here

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreateUserPayload;
    const { first_name, last_name, email, password, phone_number, date_of_birth, profile_picture, bio } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUserResult = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUserResult.rows.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await db.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, phone_number, date_of_birth, profile_picture, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        first_name,
        last_name,
        email,
        password_hash,
        phone_number ?? null,
        date_of_birth ?? null,
        profile_picture ?? null,
        bio ?? null
      ]
    );

    // In a real app, you might want to return the user object or a JWT
    return NextResponse.json({ message: 'User created successfully', userId: Number(result.lastInsertRowid) }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 