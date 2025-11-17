import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { AppointmentModel } from '@/lib/models/appointment.model';
import { AppointmentStatus, Priority } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get appointment by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    const appointment = await AppointmentModel.findById(id)
      .populate('patientId', 'name cnic contact')
      .populate('doctorId', 'name specialization contact')
      .populate('hospitalId', 'name type location');

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    logger.error('Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PUT - Update appointment
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate status if provided
    if (body.status && !Object.values(AppointmentStatus).includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(AppointmentStatus).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (body.priority && !Object.values(Priority).includes(body.priority)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid priority. Must be one of: ${Object.values(Priority).join(', ')}`
        },
        { status: 400 }
      );
    }

    const appointment = await AppointmentModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    })
      .populate('patientId', 'name cnic contact')
      .populate('doctorId', 'name specialization contact')
      .populate('hospitalId', 'name type location');

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    logger.info('Appointment updated:', id);

    return NextResponse.json({ success: true, data: appointment });
  } catch (error: any) {
    logger.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete appointment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    const appointment = await AppointmentModel.findByIdAndDelete(id);

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    logger.info('Appointment deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
