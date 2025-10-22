import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

// This endpoint handles direct image uploads to Cloudinary
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Upload the image to Cloudinary
    const imageUrl = await uploadImage(image);

    return NextResponse.json({
      url: imageUrl,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

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
  const { v2: cloudinary } = await import('cloudinary');
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