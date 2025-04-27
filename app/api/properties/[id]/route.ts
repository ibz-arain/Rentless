import { db } from '@/lib/db';
import { formatPropertyData } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const propertyUpdateSchema = z.object({
  landlord_id: z.number().optional(),
  title: z.string().max(150).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  monthly_rent: z.number().optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().optional(),
  square_footage: z.number().int().optional(),
  amenities: z.array(z.string()).optional(),
  available_from: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    
    const result = await db.execute({
      sql: 'SELECT * FROM properties WHERE property_id = ?',
      args: [id]
    });
    
    if (!result.rows.length) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Log the raw property from the database
    console.log('Raw property from DB:', JSON.stringify(result.rows[0]));
    
    // Format the property data
    const formattedProperty = formatPropertyData(result.rows[0]);
    
    // Log the formatted property
    console.log('Formatted property:', formattedProperty);
    
    return NextResponse.json(formattedProperty, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch property:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    
    // Check if property exists
    const propertyCheck = await db.execute({
      sql: 'SELECT property_id FROM properties WHERE property_id = ?',
      args: [id]
    });
    
    if (!propertyCheck.rows.length) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const validatedData = propertyUpdateSchema.parse(body);
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'amenities' || key === 'images') {
          updateFields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }
    
    // Add ID at the end of values for the WHERE clause
    values.push(id);
    
    const result = await db.execute({
      sql: `UPDATE properties SET ${updateFields.join(', ')} WHERE property_id = ?`,
      args: values
    });
    
    return NextResponse.json({ 
      message: 'Property updated successfully',
      rowsAffected: result.rowsAffected 
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to update property:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    
    // Check if property exists
    const propertyCheck = await db.execute({
      sql: 'SELECT property_id FROM properties WHERE property_id = ?',
      args: [id]
    });
    
    if (!propertyCheck.rows.length) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    const result = await db.execute({
      sql: 'DELETE FROM properties WHERE property_id = ?',
      args: [id]
    });
    
    return NextResponse.json({ 
      message: 'Property deleted successfully',
      rowsAffected: result.rowsAffected 
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
} 