import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import { formatPropertyData } from '@/lib/utils'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const propertyId = url.searchParams.get('property_id')

  if (propertyId) {
    // Check if a single property is favorited
    const result = await db.execute({
      sql: 'SELECT * FROM favorites WHERE user_id = ? AND property_id = ?',
      args: [session.user.id, propertyId],
    })
    const favorited = result.rows.length > 0
    return NextResponse.json({ favorited }, { status: 200 })
  }

  // Fetch all favorited properties for the user
  const favRows = await db.execute({
    sql: 'SELECT property_id FROM favorites WHERE user_id = ?',
    args: [session.user.id],
  })
  const propertyIds = favRows.rows.map((row: any) => row.property_id)
  if (propertyIds.length === 0) {
    return NextResponse.json([], { status: 200 })
  }

  // Fetch full property details
  const placeholders = propertyIds.map(() => '?').join(',')
  const propsResult = await db.execute({
    sql: `SELECT * FROM properties WHERE property_id IN (${placeholders})`,
    args: propertyIds,
  })
  const formatted = propsResult.rows.map(formatPropertyData)
  return NextResponse.json(formatted, { status: 200 })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { property_id } = await req.json()
  if (!property_id) {
    return NextResponse.json({ error: 'property_id required' }, { status: 400 })
  }
  await db.execute({
    sql: 'INSERT OR IGNORE INTO favorites (user_id, property_id) VALUES (?, ?)',
    args: [session.user.id, property_id],
  })
  return NextResponse.json({ message: 'Favorited' }, { status: 200 })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const propertyId = url.searchParams.get('property_id')
  if (!propertyId) {
    return NextResponse.json({ error: 'property_id required' }, { status: 400 })
  }
  await db.execute({
    sql: 'DELETE FROM favorites WHERE user_id = ? AND property_id = ?',
    args: [session.user.id, propertyId],
  })
  return NextResponse.json({ message: 'Unfavorited' }, { status: 200 })
} 