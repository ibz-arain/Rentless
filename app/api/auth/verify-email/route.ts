import { NextRequest, NextResponse } from 'next/server';
import { verificationCodes } from '@/lib/verification-codes';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    console.log('🔍 Verifying email:', email);
    console.log('🔍 Code provided:', code);
    console.log('🔍 All stored codes:', Array.from(verificationCodes.keys()));
    console.log('🔍 Stored data for this email:', verificationCodes.get(email));

    // Check if verification code exists and is valid
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      console.log('❌ No verification code found for email:', email);
      return NextResponse.json({ error: 'No verification code found for this email' }, { status: 400 });
    }

    // Check if code has expired
    if (Date.now() > storedData.expiresAt) {
      console.log('⏰ Code expired for email:', email);
      verificationCodes.delete(email); // Clean up expired code
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Check if code matches
    if (storedData.code !== code) {
      console.log('❌ Code mismatch. Expected:', storedData.code, 'Got:', code);
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Code is valid - remove it from storage
    console.log('✅ Code verified successfully for email:', email);
    verificationCodes.delete(email);

    return NextResponse.json({ 
      success: true, 
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' }, 
      { status: 500 }
    );
  }
}
