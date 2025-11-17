import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { DoctorModel } from '@/lib/models/doctor.model';
import { Gender } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';

// GET - Get all doctors or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const specialization = searchParams.get('specialization');
    const hospitalId = searchParams.get('hospitalId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    if (hospitalId) {
      query.hospitalIds = hospitalId;
    }

    const doctors = await DoctorModel.find(query)
      .populate('hospitalIds', 'name type location')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await DoctorModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching doctors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}

// POST - Create a new doctor
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    const { name, cnic, cnicIV, licenseNumber } = body;

    if (!name || !cnic || !cnicIV || !licenseNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, cnic, cnicIV, licenseNumber'
        },
        { status: 400 }
      );
    }

    // Validate gender if provided
    if (body.gender && !Object.values(Gender).includes(body.gender)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid gender. Must be one of: ${Object.values(Gender).join(', ')}`
        },
        { status: 400 }
      );
    }

    const doctor = await DoctorModel.create(body);

    logger.info('Doctor created:', doctor._id);

    return NextResponse.json(
      { success: true, data: doctor },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating doctor:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create doctor' },
      { status: 500 }
    );
  }
}
