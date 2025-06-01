import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { uploadImages } from '@/lib/cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

const propertyUpdateSchema = z.object({
  title: z.string().max(150),
  description: z.string(),
  address: z.string(),
  latitude: z.number().default(0),
  longitude: z.number().default(0),
  monthly_rent: z.number(),
  bedrooms: z.number().int(),
  bathrooms: z.number(),
  square_footage: z.number().int().optional().nullable(),
  amenities: z.array(z.string()).optional().nullable(),
  available_from: z.string(),
  images: z.array(z.string()).optional().nullable(),
});

// GET a single property by ID
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const property_id = context.params.id;
    
    const result = await db.execute({
      sql: 'SELECT * FROM properties WHERE property_id = ?',
      args: [property_id],
    });
    
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(null, { status: 404 });
    }
    
    const property = result.rows[0];
    
    // Parse JSON fields
    if (property.amenities && typeof property.amenities === 'string') {
      property.amenities = JSON.parse(property.amenities);
    }
    
    if (property.images && typeof property.images === 'string') {
      property.images = JSON.parse(property.images);
    }
    
    return NextResponse.json(property, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch property:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

// UPDATE a property
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const property_id = context.params.id;
    
    // Check if the property exists and belongs to the user
    const propertyResult = await db.execute({
      sql: 'SELECT landlord_id FROM properties WHERE property_id = ?',
      args: [property_id],
    });
    
    if (!propertyResult.rows || propertyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    const property = propertyResult.rows[0];
    
    if (property.landlord_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this property' }, { status: 403 });
    }
    
    const body = await request.json();
    const validatedData = propertyUpdateSchema.parse(body);
    
    // Upload images to Cloudinary if they exist
    let imageUrls: string[] = [];
    if (validatedData.images && validatedData.images.length > 0) {
      // Check if images are already URLs or base64 data
      const imagesToUpload = validatedData.images.filter(img => img.startsWith('data:image'));
      const existingUrls = validatedData.images.filter(img => !img.startsWith('data:image'));
      
      // Upload base64 images to Cloudinary
      if (imagesToUpload.length > 0) {
        const uploadedImages = await uploadImages(imagesToUpload);
        imageUrls = [...existingUrls, ...uploadedImages];
      } else {
        imageUrls = existingUrls;
      }
    }
    
    // Convert arrays to JSON strings
    const amenitiesJson = validatedData.amenities ? JSON.stringify(validatedData.amenities) : null;
    const imagesJson = imageUrls.length > 0 ? JSON.stringify(imageUrls) : null;
    
    // Use square_footage as is, will be null if not provided
    const squareFootage = validatedData.square_footage === undefined ? null : validatedData.square_footage;
    
    await db.execute({
      sql: `
        UPDATE properties
        SET 
          title = ?,
          description = ?,
          address = ?,
          latitude = ?,
          longitude = ?,
          monthly_rent = ?,
          bedrooms = ?,
          bathrooms = ?,
          square_footage = ?,
          amenities = ?,
          available_from = ?,
          images = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE property_id = ?
      `,
      args: [
        validatedData.title,
        validatedData.description,
        validatedData.address,
        validatedData.latitude,
        validatedData.longitude,
        validatedData.monthly_rent,
        validatedData.bedrooms,
        validatedData.bathrooms,
        squareFootage,
        amenitiesJson,
        validatedData.available_from,
        imagesJson,
        property_id
      ]
    });
    
    return NextResponse.json({ 
      message: 'Property updated successfully',
      property_id
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to update property:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

// DELETE a property
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const property_id = context.params.id;
    
    // Check if the property exists and belongs to the user
    const propertyResult = await db.execute({
      sql: 'SELECT landlord_id FROM properties WHERE property_id = ?',
      args: [property_id],
    });
    
    if (!propertyResult.rows || propertyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    const property = propertyResult.rows[0];
    
    if (property.landlord_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this property' }, { status: 403 });
    }
    
    // Delete the property
    await db.execute({
      sql: 'DELETE FROM properties WHERE property_id = ?',
      args: [property_id],
    });
    
    return NextResponse.json({ 
      message: 'Property deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
} 