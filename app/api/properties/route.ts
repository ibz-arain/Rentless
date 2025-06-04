import { db } from '@/lib/db';
import { formatPropertyData } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

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

// Schema for updates (excludes landlord_id)
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
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

    // Format the property data and ensure JSON fields are properly parsed
    const formattedProperties = result.rows.map(property => {
      return formatPropertyData(property);
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const validatedData = propertySchema.parse(body);
    
    // Images are expected to be Cloudinary URLs from the client
    const imageUrls: string[] = validatedData.images && validatedData.images.length > 0
      ? validatedData.images
      : [];
    
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

// UPDATE a property
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Verify ownership
    const propertyResult = await db.execute({
      sql: 'SELECT landlord_id FROM properties WHERE property_id = ?',
      args: [id],
    });
    if (!propertyResult.rows?.length) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    const property = propertyResult.rows[0];
    if (property.landlord_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this property' }, { status: 403 });
    }
    const body = await req.json();
    const validatedData = propertyUpdateSchema.parse(body);
    // Images are expected to be Cloudinary URLs from the client
    const imageUrls: string[] = validatedData.images?.length ? validatedData.images : [];
    const amenitiesJson = validatedData.amenities ? JSON.stringify(validatedData.amenities) : null;
    const imagesJson = imageUrls.length ? JSON.stringify(imageUrls) : null;
    const squareFootage = validatedData.square_footage === undefined ? null : validatedData.square_footage;
    await db.execute({
      sql: `
        UPDATE properties
        SET title = ?, description = ?, address = ?, latitude = ?, longitude = ?, monthly_rent = ?, bedrooms = ?, bathrooms = ?, square_footage = ?, amenities = ?, available_from = ?, images = ?, updated_at = CURRENT_TIMESTAMP
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
        id,
      ],
    });
    return NextResponse.json({ message: 'Property updated successfully', property_id: id }, { status: 200 });
  } catch (error) {
    console.error('Failed to update property:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

// DELETE a property
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const propertyResult = await db.execute({
      sql: 'SELECT landlord_id FROM properties WHERE property_id = ?',
      args: [id],
    });
    if (!propertyResult.rows?.length) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    const property = propertyResult.rows[0];
    if (property.landlord_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this property' }, { status: 403 });
    }
    await db.execute({
      sql: 'DELETE FROM properties WHERE property_id = ?',
      args: [id],
    });
    return NextResponse.json({ message: 'Property deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
} 