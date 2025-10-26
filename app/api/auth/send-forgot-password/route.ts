import { NextRequest, NextResponse } from 'next/server';
import { TransactionalEmailsApi, SendSmtpEmail, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import { verificationCodes } from '@/lib/verification-codes';
import { db } from '@/lib/db';

// Initialize Brevo API
const brevoApi = new TransactionalEmailsApi();
brevoApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if email exists in database
    const user = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (user.rows.length === 0) {
      // Don't reveal that email doesn't exist for security
      return NextResponse.json({ 
        success: true,
        message: 'If this email exists, a verification code has been sent.'
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiration (5 minutes) using email as key
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    verificationCodes.set(email, { code: verificationCode, expiresAt });

    console.log('📧 Sending forgot password email to:', email);
    console.log('🔑 Generated code:', verificationCode);

    // Send email using Brevo
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = "Reset your Rentless password";
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your Rentless password</title>
        <style>
          @media (prefers-color-scheme: dark) {
            .email-container {
              background-color: #09182b !important;
            }
            .email-content {
              background-color: #0f2942 !important;
            }
            .email-text {
              color: #fefbf3 !important;
            }
            .email-text-muted {
              color: #9ca3af !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        <div class="email-container" style="background-color: #f4f1e9; padding: 40px 20px;">
          <div class="email-content" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background-color: #e94351; border-radius: 8px 8px 0 0; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <p class="email-text" style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                We received a request to reset your password for your Rentless account. Use the verification code below to continue:
              </p>
              
              <!-- Verification Code Box -->
              <div style="background: linear-gradient(135deg, #e94351 0%, #d73542 100%); border-radius: 12px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 6px rgba(233, 67, 81, 0.2);">
                <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff; text-align: center; font-family: 'Courier New', monospace; margin: 10px 0;">
                  ${verificationCode}
                </div>
                <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 15px 0 0 0; text-align: center;">
                  ⏰ Expires in 5 minutes
                </p>
              </div>
              
              <!-- Instructions -->
              <div style="background-color: #f4f1e9; border-left: 4px solid #e94351; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p class="email-text-muted" style="color: #475569; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Next Steps:</p>
                <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                  <li>Enter the verification code above</li>
                  <li>Create your new password</li>
                  <li>Log in to your account</li>
                </ol>
              </div>
              
              <!-- Security Notice -->
              <div style="background-color: #f4f1e9; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p class="email-text-muted" style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6;">
                  <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f4f1e9; padding: 24px; text-align: center; border-radius: 0 0 8px 8px;">
              <p class="email-text-muted" style="color: #475569; margin: 0 0 8px 0; font-size: 14px;">
                This email was sent by <strong style="color: #e94351;">Rentless</strong>
              </p>
              <p class="email-text-muted" style="color: #475569; margin: 0; font-size: 12px;">
                © 2024 Rentless. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    sendSmtpEmail.sender = { name: 'Rentless', email: process.env.BREVO_SENDER_EMAIL || 'noreply@rentless.com' };
    sendSmtpEmail.to = [{ email }];

    try {
      const emailResult = await brevoApi.sendTransacEmail(sendSmtpEmail);
      console.log('📧 Email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('❌ Error sending email via Brevo:', emailError);
      // Still return success to avoid revealing if email exists
      return NextResponse.json({ 
        success: true,
        message: 'If this email exists, a verification code has been sent.'
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'If this email exists, a verification code has been sent.'
    });

  } catch (error) {
    console.error('Error sending forgot password email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' }, 
      { status: 500 }
    );
  }
}

