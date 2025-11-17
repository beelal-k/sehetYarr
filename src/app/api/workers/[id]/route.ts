import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { WorkerModel } from '@/lib/models/worker.model';
import { Designation, Department, WorkerGender } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get worker by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid worker ID' },
        { status: 400 }
      );
    }

    const worker = await WorkerModel.findById(id).populate('hospitalIds', 'name type location');

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: worker });
  } catch (error) {
    logger.error('Error fetching worker:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch worker' },
      { status: 500 }
    );
  }
}

// PUT - Update worker
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid worker ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate designation if provided
    if (body.designation && !Object.values(Designation).includes(body.designation)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid designation. Must be one of: ${Object.values(Designation).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate department if provided
    if (body.department && !Object.values(Department).includes(body.department)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid department. Must be one of: ${Object.values(Department).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate gender if provided
    if (body.gender && !Object.values(WorkerGender).includes(body.gender)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid gender. Must be one of: ${Object.values(WorkerGender).join(', ')}`
        },
        { status: 400 }
      );
    }

    const worker = await WorkerModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    }).populate('hospitalIds', 'name type location');

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      );
    }

    logger.info('Worker updated:', id);

    return NextResponse.json({ success: true, data: worker });
  } catch (error: any) {
    logger.error('Error updating worker:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update worker' },
      { status: 500 }
    );
  }
}

// DELETE - Delete worker
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid worker ID' },
        { status: 400 }
      );
    }

    const worker = await WorkerModel.findByIdAndDelete(id);

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      );
    }

    logger.info('Worker deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Worker deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting worker:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete worker' },
      { status: 500 }
    );
  }
}
