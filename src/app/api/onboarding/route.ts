import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db/connect';
import { UserModel, UserRole } from '@/lib/models/user.model';
import { HospitalModel } from '@/lib/models/hospital.model';
import { DoctorModel } from '@/lib/models/doctor.model';
import { PatientModel } from '@/lib/models/patient.model';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { role, data } = body;

    // Find the user in our DB
    const dbUser = await UserModel.findOne({ clerkId: userId });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (role === 'hospital') {
      // Create Hospital
      const newHospital = await HospitalModel.create({
        ...data,
        userId: dbUser._id,
      });

      // Update User Role
      dbUser.role = UserRole.HOSPITAL;
      await dbUser.save();

      // Sync to Clerk
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: 'hospital' }
      });

      return NextResponse.json({ success: true, hospital: newHospital });
    } else if (role === 'doctor') {
      // Create Doctor
      const newDoctor = await DoctorModel.create({
        ...data,
        userId: dbUser._id,
      });

      // Update User Role
      dbUser.role = UserRole.DOCTOR;
      await dbUser.save();

      // Sync to Clerk
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: 'doctor' }
      });

      return NextResponse.json({ success: true, doctor: newDoctor });
    } else if (role === 'patient') {
      // Check for existing shadow profile by CNIC or Phone
      // We prioritize CNIC as it's more unique, but phone is also good for syncing
      const existingPatient = await PatientModel.findOne({
        $or: [
          { cnic: data.cnic },
          { 'contact.primaryNumber': data.contact?.primaryNumber }
        ]
      });

      let patient;

      if (existingPatient) {
        // Merge/Claim Profile
        existingPatient.clerkId = userId;
        existingPatient.userId = dbUser._id;
        
        // Update basic info if missing or to ensure it's current
        if (data.name) existingPatient.name = data.name;
        if (data.gender) existingPatient.gender = data.gender;
        if (data.dateOfBirth) existingPatient.dateOfBirth = data.dateOfBirth;
        
        await existingPatient.save();
        patient = existingPatient;
      } else {
        // Create New Patient
        patient = await PatientModel.create({
          ...data,
          clerkId: userId,
          userId: dbUser._id
        });
      }

      // Update User Role
      dbUser.role = UserRole.PATIENT;
      await dbUser.save();

      // Sync to Clerk
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: 'patient' }
      });

      return NextResponse.json({ success: true, patient });
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Onboarding Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
