import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { HospitalModel } from '@/lib/models/hospital.model';
import { HospitalType, OwnershipType } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get hospital by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid hospital ID' },
        { status: 400 }
      );
    }

    const hospital = await HospitalModel.findById(id);

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: 'Hospital not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: hospital });
  } catch (error) {
    logger.error('Error fetching hospital:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hospital' },
      { status: 500 }
    );
  }
}

// PUT - Update hospital
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid hospital ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate enums if provided
    if (body.type && !Object.values(HospitalType).includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid hospital type. Must be one of: ${Object.values(HospitalType).join(', ')}`
        },
        { status: 400 }
      );
    }

    if (body.ownershipType && !Object.values(OwnershipType).includes(body.ownershipType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid ownership type. Must be one of: ${Object.values(OwnershipType).join(', ')}`
        },
        { status: 400 }
      );
    }

    const hospital = await HospitalModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    });

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: 'Hospital not found' },
        { status: 404 }
      );
    }

    logger.info('Hospital updated:', id);

    return NextResponse.json({ success: true, data: hospital });
  } catch (error: any) {
    logger.error('Error updating hospital:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update hospital' },
      { status: 500 }
    );
  }
}

// DELETE - Delete hospital
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid hospital ID' },
        { status: 400 }
      );
    }

    const hospital = await HospitalModel.findByIdAndDelete(id);

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: 'Hospital not found' },
        { status: 404 }
      );
    }

    logger.info('Hospital deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting hospital:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete hospital' },
      { status: 500 }
    );
  }
}
