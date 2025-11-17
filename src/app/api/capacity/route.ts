import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { CapacityModel } from '@/lib/models/capacity.model';
import { WardType } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get all capacity records or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId');
    const wardType = searchParams.get('wardType');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    if (hospitalId && isValidObjectId(hospitalId)) {
      query.hospitalId = hospitalId;
    }

    if (wardType && Object.values(WardType).includes(wardType as WardType)) {
      query.wardType = wardType;
    }

    if (availableOnly) {
      query.$expr = { $gt: ['$totalBeds', '$occupiedBeds'] };
    }

    const capacities = await CapacityModel.find(query)
      .populate('hospitalId', 'name type location')
      .populate('equipmentIds', 'name category status')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await CapacityModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: capacities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching capacity records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch capacity records' },
      { status: 500 }
    );
  }
}

// POST - Create a new capacity record
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    const { hospitalId, wardType, totalBeds, occupiedBeds } = body;

    if (!hospitalId || !wardType || totalBeds === undefined || occupiedBeds === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: hospitalId, wardType, totalBeds, occupiedBeds'
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

    // Validate ward type enum
    if (!Object.values(WardType).includes(wardType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid ward type. Must be one of: ${Object.values(WardType).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate bed counts
    if (totalBeds < 0 || occupiedBeds < 0) {
      return NextResponse.json(
        { success: false, error: 'Bed counts cannot be negative' },
        { status: 400 }
      );
    }

    if (occupiedBeds > totalBeds) {
      return NextResponse.json(
        { success: false, error: 'Occupied beds cannot exceed total beds' },
        { status: 400 }
      );
    }

    // Calculate available beds
    const availableBeds = totalBeds - occupiedBeds;

    const capacity = await CapacityModel.create({
      ...body,
      availableBeds
    });

    logger.info('Capacity record created:', capacity._id);

    return NextResponse.json(
      { success: true, data: capacity },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating capacity record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create capacity record' },
      { status: 500 }
    );
  }
}
