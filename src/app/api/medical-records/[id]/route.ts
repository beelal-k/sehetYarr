import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { MedicalRecordModel } from '@/lib/models/medical-record.model';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get medical record by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid medical record ID' },
        { status: 400 }
      );
    }

    const record = await MedicalRecordModel.findById(id)
      .populate('patientId', 'name cnic bloodGroup medicalHistory')
      .populate('doctorId', 'name specialization licenseNumber')
      .populate('hospitalId', 'name type location');

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Medical record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    logger.error('Error fetching medical record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medical record' },
      { status: 500 }
    );
  }
}

// PUT - Update medical record
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid medical record ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const record = await MedicalRecordModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    })
      .populate('patientId', 'name cnic bloodGroup')
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name type');

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Medical record not found' },
        { status: 404 }
      );
    }

    logger.info('Medical record updated:', id);

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    logger.error('Error updating medical record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update medical record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete medical record
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid medical record ID' },
        { status: 400 }
      );
    }

    const record = await MedicalRecordModel.findByIdAndDelete(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Medical record not found' },
        { status: 404 }
      );
    }

    logger.info('Medical record deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting medical record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete medical record' },
      { status: 500 }
    );
  }
}
