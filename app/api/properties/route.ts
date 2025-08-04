import { db } from '@/lib/db';
import { formatPropertyData } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { uploadImages } from '@/lib/cloudinary';
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

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const landlordId = url.searchParams.get('landlordId');
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    
    // New filtering parameters
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radius = url.searchParams.get('radius') || '100'; // Default 100km radius
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const beds = url.searchParams.get('beds');
    const baths = url.searchParams.get('baths');
    const moveInDate = url.searchParams.get('moveInDate');
    const amenities = url.searchParams.get('amenities');
    const sortOrder = url.searchParams.get('sortOrder');
    
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params: any[] = [];
    
    // Handle specific property or landlord queries
    if (id) {
      query += ' AND property_id = ?';
      params.push(id);
    } else if (landlordId) {
      query += ' AND landlord_id = ?';
      params.push(landlordId);
    } else if (type === 'featured') {
      // For featured properties: get 12 oldest available properties
      query += ' AND available_from <= DATE("now") ORDER BY property_id ASC LIMIT 12';
    } else {
      // Apply filters for general property search
      
      // Price range filter
      if (minPrice) {
        query += ' AND monthly_rent >= ?';
        params.push(parseFloat(minPrice));
      }
      if (maxPrice && maxPrice !== '10000') {
        query += ' AND monthly_rent <= ?';
        params.push(parseFloat(maxPrice));
      }
      
      // Bedrooms filter
      if (beds) {
        if (beds === '5+') {
          query += ' AND bedrooms >= 5';
        } else {
          query += ' AND bedrooms = ?';
          params.push(parseInt(beds));
        }
      }
      
      // Bathrooms filter
      if (baths) {
        if (baths === '4+') {
          query += ' AND bathrooms >= 4';
        } else {
          query += ' AND bathrooms = ?';
          params.push(parseFloat(baths));
        }
      }
      
      // Move-in date filter
      if (moveInDate) {
        query += ' AND available_from <= ?';
        params.push(moveInDate);
      }
      
      // Amenities filter (if specified)
      if (amenities) {
        const amenityList = amenities.split(',');
        // For each amenity, check if it exists in the amenities JSON array
        amenityList.forEach((amenity, index) => {
          query += ` AND JSON_EXTRACT(amenities, '$[*]') LIKE ?`;
          params.push(`%"${amenity}"%`);
        });
      }
      
      // Location-based filtering
      if (lat && lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius);
        
        // Use a bounding box for initial filtering (more efficient than calculating distance for all records)
        // 1 degree of latitude ≈ 111 km, 1 degree of longitude ≈ 111 * cos(latitude) km
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
        
        query += ' AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
        params.push(latitude - latDelta, latitude + latDelta, longitude - lngDelta, longitude + lngDelta);
      }
      
      // Sorting
      if (sortOrder === 'asc') {
        query += ' ORDER BY monthly_rent ASC';
      } else if (sortOrder === 'desc') {
        query += ' ORDER BY monthly_rent DESC';
      } else {
        // Default sorting by creation date (newest first)
        query += ' ORDER BY created_at DESC';
      }
    }
    
    const result = await db.execute({ sql: query, args: params });
    
    // Format the property data and ensure JSON fields are properly parsed
    let formattedProperties = result.rows.map(property => {
      return formatPropertyData(property);
    });
    
    // If location-based search, calculate distances and filter by actual radius
    if (lat && lng && !id && !landlordId && type !== 'featured') {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      
      formattedProperties = formattedProperties.filter(property => {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          property.latitude, 
          property.longitude
        );
        return distance <= radiusKm;
      });
      
      // Sort by distance if no other sort order is specified
      if (!sortOrder) {
        formattedProperties.sort((a, b) => {
          const distanceA = calculateDistance(latitude, longitude, a.latitude, a.longitude);
          const distanceB = calculateDistance(latitude, longitude, b.latitude, b.longitude);
          return distanceA - distanceB;
        });
      }
    }
    
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
    // Handle images
    let imageUrls: string[] = [];
    if (validatedData.images?.length) {
      const imagesToUpload = validatedData.images.filter(img => img.startsWith('data:image'));
      const existingUrls = validatedData.images.filter(img => !img.startsWith('data:image'));
      if (imagesToUpload.length) {
        const uploaded = await uploadImages(imagesToUpload);
        imageUrls = [...existingUrls, ...uploaded];
      } else {
        imageUrls = existingUrls;
      }
    }
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