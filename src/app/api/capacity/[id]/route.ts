import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { CapacityModel } from '@/lib/models/capacity.model';
import { WardType } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get capacity record by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid capacity record ID' },
        { status: 400 }
      );
    }

    const capacity = await CapacityModel.findById(id)
      .populate('hospitalId', 'name type location')
      .populate('equipmentIds', 'name category status quantity inUse');

    if (!capacity) {
      return NextResponse.json(
        { success: false, error: 'Capacity record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: capacity });
  } catch (error) {
    logger.error('Error fetching capacity record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch capacity record' },
      { status: 500 }
    );
  }
}

// PUT - Update capacity record
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid capacity record ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate ward type if provided
    if (body.wardType && !Object.values(WardType).includes(body.wardType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid ward type. Must be one of: ${Object.values(WardType).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate bed counts if provided
    if (body.totalBeds !== undefined && body.totalBeds < 0) {
      return NextResponse.json(
        { success: false, error: 'Total beds cannot be negative' },
        { status: 400 }
      );
    }

    if (body.occupiedBeds !== undefined && body.occupiedBeds < 0) {
      return NextResponse.json(
        { success: false, error: 'Occupied beds cannot be negative' },
        { status: 400 }
      );
    }

    // Get current record to validate bed counts
    const currentCapacity = await CapacityModel.findById(id);
    if (!currentCapacity) {
      return NextResponse.json(
        { success: false, error: 'Capacity record not found' },
        { status: 404 }
      );
    }

    const totalBeds = body.totalBeds !== undefined ? body.totalBeds : currentCapacity.totalBeds;
    const occupiedBeds = body.occupiedBeds !== undefined ? body.occupiedBeds : currentCapacity.occupiedBeds;

    if (occupiedBeds > totalBeds) {
      return NextResponse.json(
        { success: false, error: 'Occupied beds cannot exceed total beds' },
        { status: 400 }
      );
    }

    // Calculate available beds
    const availableBeds = totalBeds - occupiedBeds;

    const capacity = await CapacityModel.findByIdAndUpdate(
      id,
      { ...body, availableBeds },
      { new: true, runValidators: true }
    )
      .populate('hospitalId', 'name type location')
      .populate('equipmentIds', 'name category status');

    if (!capacity) {
      return NextResponse.json(
        { success: false, error: 'Capacity record not found' },
        { status: 404 }
      );
    }

    logger.info('Capacity record updated:', id);

    return NextResponse.json({ success: true, data: capacity });
  } catch (error: any) {
    logger.error('Error updating capacity record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update capacity record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete capacity record
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid capacity record ID' },
        { status: 400 }
      );
    }

    const capacity = await CapacityModel.findByIdAndDelete(id);

    if (!capacity) {
      return NextResponse.json(
        { success: false, error: 'Capacity record not found' },
        { status: 404 }
      );
    }

    logger.info('Capacity record deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Capacity record deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting capacity record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete capacity record' },
      { status: 500 }
    );
  }
}
