import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { FacilityModel } from '@/lib/models/facility.model';
import { FacilityCategory, FacilityStatus } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get all facilities or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    if (hospitalId && isValidObjectId(hospitalId)) {
      query.hospitalId = hospitalId;
    }

    if (category && Object.values(FacilityCategory).includes(category as FacilityCategory)) {
      query.category = category;
    }

    if (status && Object.values(FacilityStatus).includes(status as FacilityStatus)) {
      query.status = status;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const facilities = await FacilityModel.find(query)
      .populate('hospitalId', 'name type location')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await FacilityModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: facilities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching facilities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch facilities' },
      { status: 500 }
    );
  }
}

// POST - Create a new facility
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    const { hospitalId, category, name, quantity, status } = body;

    if (!hospitalId || !category || !name || quantity === undefined || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: hospitalId, category, name, quantity, status'
        },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!isValidObjectId(hospitalId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid hospital ID' },
        { status: 400 }
      );
    }

    // Validate category enum
    if (!Object.values(FacilityCategory).includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category. Must be one of: ${Object.values(FacilityCategory).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate status enum
    if (!Object.values(FacilityStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(FacilityStatus).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate quantity
    if (quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity cannot be negative' },
        { status: 400 }
      );
    }

    // Validate inUse if provided
    if (body.inUse !== undefined) {
      if (body.inUse < 0) {
        return NextResponse.json(
          { success: false, error: 'In use quantity cannot be negative' },
          { status: 400 }
        );
      }
      if (body.inUse > quantity) {
        return NextResponse.json(
          { success: false, error: 'In use quantity cannot exceed total quantity' },
          { status: 400 }
        );
      }
    }

    const facility = await FacilityModel.create(body);

    logger.info('Facility created:', facility._id);

    return NextResponse.json(
      { success: true, data: facility },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating facility:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create facility' },
      { status: 500 }
    );
  }
}
