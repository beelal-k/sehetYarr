import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { PatientModel } from '@/lib/models/patient.model';
import { Gender, BloodGroup } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';
import { auth } from '@clerk/nextjs/server';
import { UserModel, UserRole } from '@/lib/models/user.model';
import { HospitalModel } from '@/lib/models/hospital.model';
import { AppointmentModel } from '@/lib/models/appointment.model';
import { DoctorModel } from '@/lib/models/doctor.model';
import { PatientHospitalModel } from '@/lib/models/patient-hospital.model';

// GET - Get all patients or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = await auth();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const lookup = searchParams.get('lookup') === 'true';
    const gender = searchParams.get('gender');
    const bloodGroup = searchParams.get('bloodGroup');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    // Role-based filtering
    if (userId) {
      const user = await UserModel.findOne({ clerkId: userId });
      if (user) {
        if (user.role === UserRole.HOSPITAL) {
          // If lookup is true, we allow searching globally (to find patients to add)
          // Otherwise, we only show patients linked to this hospital
          if (!lookup) {
            const hospital = await HospitalModel.findOne({ userId: user._id });
            if (hospital) {
              // Find patients linked to this hospital
              const linkedPatients = await PatientHospitalModel.find({ hospitalId: hospital._id }).distinct('patientId');
              query._id = { $in: linkedPatients };
            } else {
              // If hospital profile is missing, show no patients
              query._id = { $in: [] };
            }
          }
        } else if (user.role === UserRole.DOCTOR) {
          if (!lookup) {
            const doctor = await DoctorModel.findOne({ userId: user._id });
            if (doctor) {
               // Find patients who have appointments with this doctor
               const appointments = await AppointmentModel.find({ doctorId: doctor._id }).distinct('patientId');
               query._id = { $in: appointments };
            } else {
              // If doctor profile is missing, show no patients
              query._id = { $in: [] };
            }
          }
        } else if (user.role === UserRole.PATIENT) {
          // Patients can only see their own profile
          query.clerkId = userId;
        }
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { 'contact.primaryNumber': { $regex: search, $options: 'i' } }
      ];
    }

    if (gender && Object.values(Gender).includes(gender as Gender)) {
      query.gender = gender;
    }

    if (bloodGroup && Object.values(BloodGroup).includes(bloodGroup as BloodGroup)) {
      query.bloodGroup = bloodGroup;
    }

    const patients = await PatientModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await PatientModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST - Create a new patient
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = await auth();

    const body = await req.json();

    // Validate required fields
    const { name, gender, dateOfBirth, cnic, cnicIV } = body;

    if (!name || !gender || !dateOfBirth || !cnic || !cnicIV) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, gender, dateOfBirth, cnic, cnicIV'
        },
        { status: 400 }
      );
    }

    // Validate gender enum
    if (!Object.values(Gender).includes(gender)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid gender. Must be one of: ${Object.values(Gender).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate blood group if provided
    if (body.bloodGroup && !Object.values(BloodGroup).includes(body.bloodGroup)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid blood group. Must be one of: ${Object.values(BloodGroup).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date of birth format' },
        { status: 400 }
      );
    }

    // Check for existing patient with same CNIC or Phone
    const existingPatient = await PatientModel.findOne({
      $or: [
        { cnic: cnic },
        { 'contact.primaryNumber': body.contact?.primaryNumber }
      ]
    });

    // Determine if the creator is a hospital
    let hospitalId = null;
    let userRole = null;

    if (userId) {
      const user = await UserModel.findOne({ clerkId: userId });
      if (user) {
        userRole = user.role;
        logger.info(`User role: ${user.role}, User ID: ${user._id}`);
        
        if (user.role === UserRole.HOSPITAL) {
          const hospital = await HospitalModel.findOne({ userId: user._id });
          logger.info(`Hospital lookup result:`, hospital ? `Found ID: ${hospital._id}` : 'Not found');
          
          if (hospital) {
            hospitalId = hospital._id;
          } else {
            logger.error(`Hospital profile not found for user ${user._id}`);
          }
        }
      }
    }

    if (existingPatient) {
      // If hospital, link the patient instead of error
      if (hospitalId) {
        const existingLink = await PatientHospitalModel.findOne({
          patientId: existingPatient._id,
          hospitalId: hospitalId
        });

        if (!existingLink) {
          await PatientHospitalModel.create({
            patientId: existingPatient._id,
            hospitalId: hospitalId
          });
          return NextResponse.json(
            { 
              success: true, 
              message: 'Patient already exists and has been linked to your hospital',
              data: existingPatient 
            },
            { status: 200 }
          );
        } else {
           return NextResponse.json(
            { 
              success: true, 
              message: 'Patient is already linked to your hospital',
              data: existingPatient 
            },
            { status: 200 }
          );
        }
      }

      // If not a hospital or hospital profile missing
      const errorDetails = userRole === UserRole.HOSPITAL 
        ? 'Hospital profile not found. Please complete your hospital registration.'
        : 'Patient already exists in the system.';
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorDetails,
          userRole: userRole,
          data: existingPatient 
        },
        { status: 409 }
      );
    }

    const patient = await PatientModel.create(body);

    // If created by hospital, create link
    if (hospitalId) {
      await PatientHospitalModel.create({
        patientId: patient._id,
        hospitalId: hospitalId
      });
    }

    logger.info('Patient created:', patient._id);

    return NextResponse.json(
      { success: true, data: patient },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating patient:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create patient' },
      { status: 500 }
    );
  }
}
