import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// This endpoint provides a signature and timestamp for signed Cloudinary uploads
export async function GET(req: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  // Optional folder for uploads
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'rentless';

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Cloudinary credentials are not set in environment.' },
      { status: 500 }
    );
  }

  // Configure Cloudinary client
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  // Create timestamp and signature
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret
  );

  // Return required parameters for client upload
  return NextResponse.json({
    cloudName,
    apiKey,
    signature,
    timestamp,
    folder,
  });
} 