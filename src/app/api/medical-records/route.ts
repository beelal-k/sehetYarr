import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { MedicalRecordModel } from '@/lib/models/medical-record.model';
import { UserModel, UserRole } from '@/lib/models/user.model';
import { PatientModel } from '@/lib/models/patient.model';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';
import { auth } from '@clerk/nextjs/server';

// GET - Get all medical records or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = await auth();

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const hospitalId = searchParams.get('hospitalId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    // Role-based access control
    if (userId) {
      const user = await UserModel.findOne({ clerkId: userId });
      
      if (user) {
        if (user.role === UserRole.PATIENT) {
          // Find the patient record associated with this user
          // Try to find by userId first, then by email
          const patient = await PatientModel.findOne({
            $or: [
              { userId: user._id },
              { email: user.email }
            ]
          });

          if (patient) {
            query.patientId = patient._id;
          } else {
            // If user is a patient but has no patient record, they shouldn't see any medical records
            return NextResponse.json({
              success: true,
              data: [],
              pagination: { page, limit, total: 0, pages: 0 }
            });
          }
        }
        // Doctors and Admins can see all records (filtered by params)
        // Workers might also need access
      }
    }

    if (patientId && isValidObjectId(patientId)) {
      // If query param is provided, ensure it matches the enforced patientId (if any)
      if (query.patientId && query.patientId.toString() !== patientId) {
         // Trying to access someone else's records
         return NextResponse.json(
          { success: false, error: 'Unauthorized access to medical records' },
          { status: 403 }
        );
      }
      query.patientId = patientId;
    }

    if (doctorId && isValidObjectId(doctorId)) {
      query.doctorId = doctorId;
    }

    if (hospitalId && isValidObjectId(hospitalId)) {
      query.hospitalId = hospitalId;
    }

    const records = await MedicalRecordModel.find(query)
      .populate('patientId', 'name cnic bloodGroup')
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name type')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ visitDate: -1 });

    const total = await MedicalRecordModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching medical records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}

// POST - Create a new medical record
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    const { patientId, doctorId, hospitalId } = body;

    // Enforce RBAC for creation
    const { userId } = await auth();
    if (userId) {
      const user = await UserModel.findOne({ clerkId: userId });
      if (user && user.role === UserRole.PATIENT) {
        return NextResponse.json(
          { success: false, error: 'Patients cannot create medical records' },
          { status: 403 }
        );
      }
    }

    if (!patientId || !doctorId || !hospitalId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: patientId, doctorId, hospitalId'
        },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!isValidObjectId(patientId) || !isValidObjectId(doctorId) || !isValidObjectId(hospitalId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient, doctor, or hospital ID' },
        { status: 400 }
      );
    }

    const record = await MedicalRecordModel.create(body);

    logger.info('Medical record created:', record._id);

    return NextResponse.json(
      { success: true, data: record },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating medical record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create medical record' },
      { status: 500 }
    );
  }
}
