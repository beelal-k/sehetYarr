import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { HospitalModel } from '@/lib/models/hospital.model';
import { HospitalType, OwnershipType } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { auth } from '@clerk/nextjs/server';
import { UserModel, UserRole } from '@/lib/models/user.model';
import { DoctorModel } from '@/lib/models/doctor.model';

// GET - Get all hospitals or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = await auth();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const lookup = searchParams.get('lookup'); // For form dropdowns without role filtering
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    // Role-based access control (skip if lookup mode)
    if (userId && !lookup) {
      const user = await UserModel.findOne({ clerkId: userId });
      
      if (user) {
        if (user.role === UserRole.HOSPITAL) {
          // Hospital users can only see their own hospital
          const hospital = await HospitalModel.findOne({ userId: user._id });
          if (hospital) {
            query._id = hospital._id;
          } else {
            // If hospital profile is missing, show no hospitals
            query._id = { $in: [] };
          }
        } else if (user.role === UserRole.DOCTOR) {
          // Doctors can see hospitals they're affiliated with
          const doctor = await DoctorModel.findOne({ userId: user._id });
          if (doctor && doctor.hospitalIds && doctor.hospitalIds.length > 0) {
            query._id = { $in: doctor.hospitalIds };
          } else {
            // If doctor has no hospital affiliations, show no hospitals
            query._id = { $in: [] };
          }
        }
        // Admin and patient roles see all hospitals
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (type && Object.values(HospitalType).includes(type as HospitalType)) {
      query.type = type;
    }

    const hospitals = await HospitalModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await HospitalModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: hospitals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching hospitals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hospitals' },
      { status: 500 }
    );
  }
}

// POST - Create a new hospital
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Enforce RBAC for creation
    const { userId } = await auth();
    if (userId) {
      const user = await UserModel.findOne({ clerkId: userId });
      if (user && user.role === UserRole.PATIENT) {
        return NextResponse.json(
          { success: false, error: 'Patients cannot create hospitals' },
          { status: 403 }
        );
      }
    }

    // Validate required fields
    const { name, type, ownershipType, registrationNumber } = body;

    if (!name || !type || !ownershipType || !registrationNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, type, ownershipType, registrationNumber'
        },
        { status: 400 }
      );
    }

    // Validate enums
    if (!Object.values(HospitalType).includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid hospital type. Must be one of: ${Object.values(HospitalType).join(', ')}`
        },
        { status: 400 }
      );
    }

    if (!Object.values(OwnershipType).includes(ownershipType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid ownership type. Must be one of: ${Object.values(OwnershipType).join(', ')}`
        },
        { status: 400 }
      );
    }

    const hospital = await HospitalModel.create(body);

    logger.info('Hospital created:', hospital._id);

    return NextResponse.json(
      { success: true, data: hospital },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating hospital:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create hospital' },
      { status: 500 }
    );
  }
}
