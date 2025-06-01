import { db } from '@/lib/db';
import { formatPropertyData } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { uploadImages } from '@/lib/cloudinary';

const propertySchema = z.object({
  landlord_id: z.number(),
  title: z.string().max(150),
  description: z.string(),
  address: z.string(),
  latitude: z.number().default(0),
  longitude: z.number().default(0),
  monthly_rent: z.number(),
  bedrooms: z.number().int(),
  bathrooms: z.number(),
  square_footage: z.number().int().optional(),
  amenities: z.array(z.string()).optional(),
  available_from: z.string(),
  images: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const landlordId = url.searchParams.get('landlordId');
    const id = url.searchParams.get('id');
    
    let query = 'SELECT * FROM properties';
    const params: any[] = [];
    
    if (id) {
      query += ' WHERE property_id = ?';
      params.push(id);
    } else if (landlordId) {
      query += ' WHERE landlord_id = ?';
      params.push(landlordId);
    }
    
    const result = await db.execute({ sql: query, args: params });
    
    // Log the raw results for debugging
    console.log('Raw SQL result:', JSON.stringify(result.rows));
    
    // Format the property data and ensure JSON fields are properly parsed
    const formattedProperties = result.rows.map(property => {
      // Log each property for debugging
      console.log('Processing property:', property);
      
      // Format and parse the property data
      const formatted = formatPropertyData(property);
      
      // Log the formatted property
      console.log('Formatted property:', formatted);
      
      return formatted;
    });

    // If fetching by ID, return the first property or null
    if (id) {
      return NextResponse.json(formattedProperties[0] || null, { status: formattedProperties[0] ? 200 : 404 });
    }
    
    return NextResponse.json(formattedProperties, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = propertySchema.parse(body);
    
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
    
    const result = await db.execute({
      sql: `
        INSERT INTO properties (
          landlord_id, title, description, address, 
          latitude, longitude, monthly_rent, bedrooms, 
          bathrooms, square_footage, amenities, available_from, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        validatedData.landlord_id,
        validatedData.title,
        validatedData.description,
        validatedData.address,
        validatedData.latitude,
        validatedData.longitude,
        validatedData.monthly_rent,
        validatedData.bedrooms,
        validatedData.bathrooms,
        validatedData.square_footage || null,
        amenitiesJson,
        validatedData.available_from,
        imagesJson
      ]
    });
    
    // Convert BigInt to Number to fix serialization issue
    const propertyId = result.lastInsertRowid ? Number(result.lastInsertRowid) : null;
    
    return NextResponse.json({ 
      message: 'Property created successfully',
      property_id: propertyId
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create property:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
} 