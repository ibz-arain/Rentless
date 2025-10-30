import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { z } from 'zod';

const createBookingSchema = z.object({
  property_id: z.number(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  total_cost: z.number().optional(),
});

const updateBookingSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'cancelled', 'completed']),
});

// Helper function to calculate monthly cost based on monthly rent
function calculateBookingCost(monthlyRent: number, startDate: Date, endDate: Date): number {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const monthlyDays = 30;
  return (monthlyRent / monthlyDays) * daysDiff;
}

// Helper function to check if dates overlap
function doDatesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && start2 < end1;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const bookingId = url.searchParams.get('id');
    const propertyId = url.searchParams.get('property_id');
    const userId = url.searchParams.get('user_id');

    let query = `
      SELECT b.*, p.title, p.address, p.monthly_rent
      FROM bookings b
      LEFT JOIN properties p ON b.property_id = p.property_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (bookingId) {
      query += ' AND b.booking_id = ?';
      params.push(bookingId);
    } else if (propertyId) {
      // Check availability for a specific property
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');
      
      if (startDate && endDate) {
        query += `
          AND b.property_id = ?
          AND b.status IN ('accepted', 'pending')
          AND (
            (b.start_date <= ? AND b.end_date >= ?)
            OR (b.start_date <= ? AND b.end_date >= ?)
            OR (b.start_date >= ? AND b.end_date <= ?)
          )
        `;
        params.push(propertyId, startDate, startDate, endDate, endDate, startDate, endDate);
      } else {
        query += ' AND b.property_id = ?';
        params.push(propertyId);
      }
    } else if (userId) {
      // Get bookings for a specific user
      query += ' AND (b.tenant_id = ? OR b.landlord_id = ?)';
      params.push(userId, userId);
    } else {
      // Get all bookings for the logged-in user
      query += ' AND (b.tenant_id = ? OR b.landlord_id = ?)';
      params.push(session.user.id, session.user.id);
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await db.execute({ sql: query, args: params });
    
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createBookingSchema.parse(body);

    // Get property details including landlord_id and monthly_rent
    const propertyResult = await db.execute({
      sql: 'SELECT landlord_id, monthly_rent FROM properties WHERE property_id = ?',
      args: [validatedData.property_id],
    });

    if (propertyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const property = propertyResult.rows[0] as any;
    const landlordId = property.landlord_id;
    const monthlyRent = property.monthly_rent;

    // Check if user is the landlord
    if (session.user.id === landlordId) {
      return NextResponse.json({ error: 'You cannot book your own property' }, { status: 400 });
    }

    const startDate = new Date(validatedData.start_date);
    const endDate = validatedData.end_date ? new Date(validatedData.end_date) : null;

    // Validate dates if end_date is provided
    if (endDate && startDate >= endDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    // Check for overlapping bookings
    let existingBookingsResult;
    if (validatedData.end_date) {
      // Check for overlaps with specific end date
      existingBookingsResult = await db.execute({
        sql: `
          SELECT start_date, end_date FROM bookings
          WHERE property_id = ?
          AND status IN ('accepted', 'pending')
          AND (
            (start_date <= ? AND (end_date >= ? OR end_date IS NULL))
            OR (start_date >= ? AND end_date <= ?)
            OR (end_date IS NULL)
          )
        `,
        args: [
          validatedData.property_id,
          validatedData.start_date, validatedData.start_date,
          validatedData.start_date, validatedData.end_date
        ],
      });
    } else {
      // No end date specified - check for any bookings that overlap
      existingBookingsResult = await db.execute({
        sql: `
          SELECT start_date, end_date FROM bookings
          WHERE property_id = ?
          AND status IN ('accepted', 'pending')
          AND (
            start_date >= ? OR end_date IS NULL
          )
        `,
        args: [validatedData.property_id, validatedData.start_date],
      });
    }

    if (existingBookingsResult.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Property is not available for the selected dates',
        details: 'There is already a booking for these dates'
      }, { status: 409 });
    }

    // Calculate total cost (only if end date provided)
    const totalCost = endDate ? calculateBookingCost(monthlyRent, startDate, endDate) : null;

    // Create the booking
    const result = await db.execute({
      sql: `
        INSERT INTO bookings (
          property_id, tenant_id, landlord_id, start_date, end_date, 
          status, total_cost, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, CURRENT_DATE, CURRENT_DATE)
      `,
      args: [
        validatedData.property_id,
        session.user.id,
        landlordId,
        validatedData.start_date,
        validatedData.end_date || null,
        totalCost
      ],
    });

    const bookingId = Number(result.lastInsertRowid);

    return NextResponse.json({ 
      message: 'Booking request created successfully',
      booking_id: bookingId 
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create booking:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const bookingId = url.searchParams.get('id');
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = updateBookingSchema.parse(body);

    // Get the booking to check permissions
    const bookingResult = await db.execute({
      sql: 'SELECT * FROM bookings WHERE booking_id = ?',
      args: [bookingId],
    });

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingResult.rows[0] as any;

    // Only the landlord can approve/reject
    if (session.user.id !== booking.landlord_id) {
      return NextResponse.json({ error: 'Unauthorized to update this booking' }, { status: 403 });
    }

    // Update booking status
    await db.execute({
      sql: `
        UPDATE bookings 
        SET status = ?, updated_at = CURRENT_DATE
        WHERE booking_id = ?
      `,
      args: [validatedData.status, bookingId],
    });

    return NextResponse.json({ 
      message: 'Booking updated successfully',
      booking_id: bookingId 
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to update booking:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

