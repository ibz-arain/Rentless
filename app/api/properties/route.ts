import { db } from '@/lib/db';
import { formatPropertyData } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const validatedData = propertySchema.parse(body);
    
    // Convert arrays to JSON strings
    const amenitiesJson = validatedData.amenities ? JSON.stringify(validatedData.amenities) : null;
    const imagesJson = validatedData.images ? JSON.stringify(validatedData.images) : null;
    
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
    
    return NextResponse.json({ 
      message: 'Property created successfully',
      property_id: result.lastInsertRowid
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create property:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
} 