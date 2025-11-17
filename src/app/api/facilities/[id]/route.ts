import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { FacilityModel } from '@/lib/models/facility.model';
import { FacilityCategory, FacilityStatus } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get facility by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid facility ID' },
        { status: 400 }
      );
    }

    const facility = await FacilityModel.findById(id).populate('hospitalId', 'name type location');

    if (!facility) {
      return NextResponse.json(
        { success: false, error: 'Facility not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: facility });
  } catch (error) {
    logger.error('Error fetching facility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch facility' },
      { status: 500 }
    );
  }
}

// PUT - Update facility
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid facility ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate category if provided
    if (body.category && !Object.values(FacilityCategory).includes(body.category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category. Must be one of: ${Object.values(FacilityCategory).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !Object.values(FacilityStatus).includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(FacilityStatus).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate quantities if provided
    if (body.quantity !== undefined && body.quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity cannot be negative' },
        { status: 400 }
      );
    }

    if (body.inUse !== undefined && body.inUse < 0) {
      return NextResponse.json(
        { success: false, error: 'In use quantity cannot be negative' },
        { status: 400 }
      );
    }

    const facility = await FacilityModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    }).populate('hospitalId', 'name type location');

    if (!facility) {
      return NextResponse.json(
        { success: false, error: 'Facility not found' },
        { status: 404 }
      );
    }

    logger.info('Facility updated:', id);

    return NextResponse.json({ success: true, data: facility });
  } catch (error: any) {
    logger.error('Error updating facility:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update facility' },
      { status: 500 }
    );
  }
}

// DELETE - Delete facility
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid facility ID' },
        { status: 400 }
      );
    }

    const facility = await FacilityModel.findByIdAndDelete(id);

    if (!facility) {
      return NextResponse.json(
        { success: false, error: 'Facility not found' },
        { status: 404 }
      );
    }

    logger.info('Facility deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Facility deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting facility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete facility' },
      { status: 500 }
    );
  }
}
