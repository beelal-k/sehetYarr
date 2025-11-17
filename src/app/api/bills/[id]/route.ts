import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { BillModel } from '@/lib/models/bill.model';
import { BillStatus, PaymentMethod } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get bill by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bill ID' },
        { status: 400 }
      );
    }

    const bill = await BillModel.findById(id)
      .populate('patientId', 'name cnic contact')
      .populate('hospitalId', 'name type location')
      .populate('doctorId', 'name specialization')
      .populate('medicalRecordId');

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bill });
  } catch (error) {
    logger.error('Error fetching bill:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}

// PUT - Update bill
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bill ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate status if provided
    if (body.status && !Object.values(BillStatus).includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(BillStatus).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate payment method if provided
    if (body.paymentMethod && !Object.values(PaymentMethod).includes(body.paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid payment method. Must be one of: ${Object.values(PaymentMethod).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate amounts if provided
    if (body.totalAmount !== undefined && body.totalAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Total amount cannot be negative' },
        { status: 400 }
      );
    }

    if (body.paidAmount !== undefined && body.paidAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Paid amount cannot be negative' },
        { status: 400 }
      );
    }

    const bill = await BillModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    })
      .populate('patientId', 'name cnic contact')
      .populate('hospitalId', 'name type')
      .populate('doctorId', 'name specialization')
      .populate('medicalRecordId');

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    logger.info('Bill updated:', id);

    return NextResponse.json({ success: true, data: bill });
  } catch (error: any) {
    logger.error('Error updating bill:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update bill' },
      { status: 500 }
    );
  }
}

// DELETE - Delete bill
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bill ID' },
        { status: 400 }
      );
    }

    const bill = await BillModel.findByIdAndDelete(id);

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    logger.info('Bill deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting bill:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
}
