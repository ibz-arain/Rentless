import { NextRequest, NextResponse } from 'next/server';
import { TransactionalEmailsApi, SendSmtpEmail, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import { verificationCodes } from '@/lib/verification-codes';

// Initialize Brevo API
const brevoApi = new TransactionalEmailsApi();
brevoApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiration (5 minutes)
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    verificationCodes.set(email, { code: verificationCode, expiresAt });

    console.log('📧 Sending verification email to:', email);
    console.log('🔑 Generated code:', verificationCode);
    console.log('⏰ Expires at:', new Date(expiresAt).toISOString());
    console.log('💾 Stored in map. Total codes:', verificationCodes.size);

    // Send email using Brevo
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = "Verify your Rentless account";
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your Rentless account</title>
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
              color: #94a3b8 !important;
            }
            .email-code-bg {
              background-color: #1a3957 !important;
            }
            .email-code-text {
              color: #fefbf3 !important;
            }
            .email-instructions {
              background-color: #1a3957 !important;
            }
            .email-footer {
              background-color: #1a3957 !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #e94351 0%, #d63347 100%); padding: 32px 24px; text-align: center;">
            <div style="display: inline-block; background-color: #fefbf3; padding: 12px; border-radius: 12px; margin-bottom: 16px;">
              <img src="https://rentless.ibrahimarain.com/rentless.png" alt="Rentless" background-color: #ffffff; style="height: 50px; width: auto;" />
            </div>
          </div>
          
          <!-- Content -->
          <div class="email-content" style="padding: 40px 24px; background-color: #ffffff;">
            <h2 class="email-text" style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Verify your email address</h2>
            <p class="email-text-muted" style="color: #6b7280; margin: 0 0 32px 0; font-size: 16px; line-height: 1.6;">
              Thank you for signing up! To complete your registration and secure your account, please verify your email address using the code below.
            </p>
            
            <!-- Verification Code -->
            <div class="email-code-bg" style="background: linear-gradient(135deg, #e94351 0%, #d63347 100%); border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; text-align: center; margin: 32px 0;">
              <p class="email-text-muted" style="color: #fefbf3; margin: 0 0 16px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
              <div style="background-color: #fefbf3; border: 2px solid #e94351; border-radius: 12px; padding: 20px; display: inline-block; margin: 8px 0;">
                <span class="email-code-text" style="color: #e94351; background-color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</span>
              </div>
              <p class="email-text-muted" style="color: #fefbf3; margin: 16px 0 0 0; font-size: 14px;">This code expires in 5 minutes</p>
            </div>
            
            <!-- Instructions -->
            <div class="email-instructions" style="background-color: #f4f1e9; border-left: 4px solid #e94351; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 class="email-text" style="color: #e94351; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">What's next?</h3>
              <ol class="email-text-muted" style="color: #475569; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>Copy the verification code above</li>
                <li>Return to the signup page</li>
                <li>Enter the code to continue</li>
                <li>Complete your profile setup</li>
              </ol>
            </div>
            
            <!-- Security Notice -->
            <div class="email-instructions" style="background-color: #f4f1e9; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p class="email-text-muted" style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6;">
                <strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email. Your account remains secure.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="email-footer" style="background-color: #f4f1e9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p class="email-text-muted" style="color: #475569; margin: 0 0 8px 0; font-size: 14px;">
              This email was sent by <strong style="color: #e94351;">Rentless</strong>
            </p>
            <p class="email-text-muted" style="color: #475569; margin: 0; font-size: 12px;">
              © 2024 Rentless. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    sendSmtpEmail.sender = { name: "Rentless", email: process.env.BREVO_SENDER_EMAIL || "rentless@ibrahimarain.com" };
    sendSmtpEmail.to = [{ email }];

    await brevoApi.sendTransacEmail(sendSmtpEmail);

    return NextResponse.json({ 
      success: true, 
      message: 'Verification email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' }, 
      { status: 500 }
    );
  }
}
