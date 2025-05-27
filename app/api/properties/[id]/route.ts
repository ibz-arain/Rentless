import { db } from '@/lib/db';
import { formatPropertyData } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updatePropertySchema = z.object({
  title: z.string().max(150).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().default(0).optional(),
  longitude: z.number().default(0).optional(),
  monthly_rent: z.number().optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  square_footage: z.number().int().optional(),
  amenities: z.array(z.string()).optional(),
  available_from: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const result = await db.execute({
      sql: 'SELECT * FROM properties WHERE property_id = ?',
      args: [id],
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    const property = formatPropertyData(result.rows[0]);
    
    return NextResponse.json(property, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch property:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    
    // Validate the request body
    const validatedData = updatePropertySchema.parse(body);
    
    // Check if the property exists
    const checkResult = await db.execute({
      sql: 'SELECT * FROM properties WHERE property_id = ?',
      args: [id],
    });
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Build the SQL query dynamically based on provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Handle array fields (amenities, images) by converting to JSON
        if (Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }
    
    // Add the ID as the last parameter
    updateValues.push(id);
    
    // Execute the update query
    await db.execute({
      sql: `UPDATE properties SET ${updateFields.join(', ')} WHERE property_id = ?`,
      args: updateValues,
    });
    
    return NextResponse.json({ message: 'Property updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to update property:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Check if the property exists
    const checkResult = await db.execute({
      sql: 'SELECT * FROM properties WHERE property_id = ?',
      args: [id],
    });
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Delete the property
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