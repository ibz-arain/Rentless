import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User, UpdateUserPayload } from '@/lib/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get user profile
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.id !== parseInt(params.userId)) {
    // Allow fetching own profile, or add admin role check for other profiles
    // For now, restrict to fetching own profile
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const userResult = await db.execute('SELECT user_id, first_name, last_name, email, phone_number, email_verified, phone_verified, date_of_birth, profile_picture, bio, is_active, role, created_at, updated_at FROM users WHERE user_id = ?', [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userResult.rows[0] as unknown as User, { status: 200 });
  } catch (error) {
    console.error(`Error fetching user ${params.userId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user profile
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = parseInt(params.userId);

  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  if (!session || session.user.id !== userId) {
    // Add admin role check if admins should be able to update any user
    return NextResponse.json({ error: 'Unauthorized to update this profile' }, { status: 401 });
  }

  try {
    const body = await req.json() as UpdateUserPayload;
    const { first_name, last_name, phone_number, date_of_birth, profile_picture, bio } = body;

    // Basic validation (more can be added)
    if (Object.keys(body).length === 0) {
        return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    // Build the query dynamically based on provided fields
    const fieldsToUpdate: { [key: string]: any } = {};
    if (first_name !== undefined) fieldsToUpdate.first_name = first_name;
    if (last_name !== undefined) fieldsToUpdate.last_name = last_name;
    if (phone_number !== undefined) fieldsToUpdate.phone_number = phone_number;
    if (date_of_birth !== undefined) fieldsToUpdate.date_of_birth = date_of_birth;
    if (profile_picture !== undefined) fieldsToUpdate.profile_picture = profile_picture;
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    // Add other updatable fields from UpdateUserPayload as needed

    if (Object.keys(fieldsToUpdate).length === 0) {
        return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
    }

    fieldsToUpdate.updated_at = new Date().toISOString().split('T')[0]; // Set updated_at to current date

    const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(fieldsToUpdate), userId];

    await db.execute(`UPDATE users SET ${setClauses} WHERE user_id = ?`, values);

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error updating user ${params.userId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 