import { NextRequest, NextResponse } from 'next/server';
import { verificationCodes } from '@/lib/verification-codes';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    // Verify that email was recently verified
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      return NextResponse.json({ error: 'Please verify your email first' }, { status: 400 });
    }

    // Check if code has expired
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return NextResponse.json({ error: 'Session expired. Please start again' }, { status: 400 });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
    
    if (!/\d/.test(newPassword)) {
      return NextResponse.json({ error: 'Password must contain at least one number' }, { status: 400 });
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json({ error: 'Password must contain at least one uppercase letter' }, { status: 400 });
    }
    
    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json({ error: 'Password must contain at least one lowercase letter' }, { status: 400 });
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>_+=~`\[\]]/.test(newPassword)) {
      return NextResponse.json({ error: 'Password must contain at least one special character' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (user.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, email]
    );

    // Delete verification code after successful reset
    verificationCodes.delete(email);

    console.log('✅ Password reset successfully for email:', email);

    return NextResponse.json({ 
      success: true,
      message: 'Password reset successfully' 
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' }, 
      { status: 500 }
    );
  }
}

