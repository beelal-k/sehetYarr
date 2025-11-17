import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { HospitalModel } from '@/lib/models/hospital.model';
import { HospitalType, OwnershipType } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';

// GET - Get all hospitals or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (type && Object.values(HospitalType).includes(type as HospitalType)) {
      query.type = type;
    }

    const hospitals = await HospitalModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await HospitalModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: hospitals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching hospitals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hospitals' },
      { status: 500 }
    );
  }
}

// POST - Create a new hospital
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    const { name, type, ownershipType, registrationNumber } = body;

    if (!name || !type || !ownershipType || !registrationNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, type, ownershipType, registrationNumber'
        },
        { status: 400 }
      );
    }

    // Validate enums
    if (!Object.values(HospitalType).includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid hospital type. Must be one of: ${Object.values(HospitalType).join(', ')}`
        },
        { status: 400 }
      );
    }

    if (!Object.values(OwnershipType).includes(ownershipType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid ownership type. Must be one of: ${Object.values(OwnershipType).join(', ')}`
        },
        { status: 400 }
      );
    }

    const hospital = await HospitalModel.create(body);

    logger.info('Hospital created:', hospital._id);

    return NextResponse.json(
      { success: true, data: hospital },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating hospital:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create hospital' },
      { status: 500 }
    );
  }
}
