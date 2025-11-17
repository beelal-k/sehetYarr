import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { BillModel } from '@/lib/models/bill.model';
import { BillStatus, PaymentMethod } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get all bills or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const hospitalId = searchParams.get('hospitalId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    if (patientId && isValidObjectId(patientId)) {
      query.patientId = patientId;
    }

    if (hospitalId && isValidObjectId(hospitalId)) {
      query.hospitalId = hospitalId;
    }

    if (doctorId && isValidObjectId(doctorId)) {
      query.doctorId = doctorId;
    }

    if (status && Object.values(BillStatus).includes(status as BillStatus)) {
      query.status = status;
    }

    const bills = await BillModel.find(query)
      .populate('patientId', 'name cnic contact')
      .populate('hospitalId', 'name type')
      .populate('doctorId', 'name specialization')
      .populate('medicalRecordId')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ billDate: -1 });

    const total = await BillModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: bills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching bills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

// POST - Create a new bill
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    const { patientId, hospitalId, billDate, totalAmount, paidAmount, status, paymentMethod } = body;

    if (!patientId || !hospitalId || !billDate || totalAmount === undefined || paidAmount === undefined || !status || !paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: patientId, hospitalId, billDate, totalAmount, paidAmount, status, paymentMethod'
        },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!isValidObjectId(patientId) || !isValidObjectId(hospitalId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient or hospital ID' },
        { status: 400 }
      );
    }

    if (body.doctorId && !isValidObjectId(body.doctorId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor ID' },
        { status: 400 }
      );
    }

    if (body.medicalRecordId && !isValidObjectId(body.medicalRecordId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid medical record ID' },
        { status: 400 }
      );
    }

    // Validate status enum
    if (!Object.values(BillStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(BillStatus).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate payment method enum
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid payment method. Must be one of: ${Object.values(PaymentMethod).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate amounts
    if (totalAmount < 0 || paidAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Amounts cannot be negative' },
        { status: 400 }
      );
    }

    if (paidAmount > totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Paid amount cannot exceed total amount' },
        { status: 400 }
      );
    }

    const bill = await BillModel.create(body);

    logger.info('Bill created:', bill._id);

    return NextResponse.json(
      { success: true, data: bill },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating bill:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bill' },
      { status: 500 }
    );
  }
}
