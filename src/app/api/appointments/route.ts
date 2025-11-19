import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { AppointmentModel } from "@/lib/models/appointment.model";
import { UserModel, UserRole } from "@/lib/models/user.model";
import { PatientModel } from "@/lib/models/patient.model";
import { AppointmentStatus, Priority } from "@/lib/enums";
import { logger } from "@/lib/utils/logger";
import { isValidObjectId } from "mongoose";
import { auth } from "@clerk/nextjs/server";

// GET - Get all appointments or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = await auth();

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const doctorId = searchParams.get("doctorId");
    const hospitalId = searchParams.get("hospitalId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query: any = {};

    // Role-based access control
    if (userId) {
      const user = await UserModel.findOne({ clerkId: userId });
      
      if (user) {
        if (user.role === UserRole.PATIENT) {
          // Find the patient record associated with this user
          const patient = await PatientModel.findOne({
            $or: [
              { userId: user._id },
              { email: user.email }
            ]
          });

          if (patient) {
            query.patientId = patient._id;
          } else {
            // If user is a patient but has no patient record, they shouldn't see any appointments
            return NextResponse.json({
              success: true,
              data: [],
              pagination: { page, limit, total: 0, pages: 0 }
            });
          }
        }
      }
    }

    if (patientId && isValidObjectId(patientId)) {
      // If query param is provided, ensure it matches the enforced patientId (if any)
      if (query.patientId && query.patientId.toString() !== patientId) {
         return NextResponse.json(
          { success: false, error: 'Unauthorized access to appointments' },
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

    if (
      status &&
      Object.values(AppointmentStatus).includes(status as AppointmentStatus)
    ) {
      query.status = status;
    }

    if (priority && Object.values(Priority).includes(priority as Priority)) {
      query.priority = priority;
    }

    const appointments = await AppointmentModel.find(query)
      .populate("patientId", "name cnic contact")
      .populate("doctorId", "name specialization contact")
      .populate("hospitalId", "name type location")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ appointmentDate: -1 });

    const total = await AppointmentModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST - Create a new appointment
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    const { patientId, doctorId, hospitalId, appointmentDate, status } = body;

    if (!patientId || !doctorId || !hospitalId || !appointmentDate || !status) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: patientId, doctorId, hospitalId, appointmentDate, status",
        },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (
      !isValidObjectId(patientId) ||
      !isValidObjectId(doctorId) ||
      !isValidObjectId(hospitalId)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid patient, doctor, or hospital ID" },
        { status: 400 }
      );
    }

    // Validate status enum
    if (!Object.values(AppointmentStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(AppointmentStatus).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (body.priority && !Object.values(Priority).includes(body.priority)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid priority. Must be one of: ${Object.values(Priority).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate appointment date
    const date = new Date(appointmentDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment date format" },
        { status: 400 }
      );
    }

    const appointment = await AppointmentModel.create(body);

    logger.info("Appointment created:", appointment._id);

    return NextResponse.json(
      { success: true, data: appointment },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error("Error creating appointment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create appointment",
      },
      { status: 500 }
    );
  }
}
