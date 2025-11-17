import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { WorkerModel } from '@/lib/models/worker.model';
import { Designation, Department, WorkerGender } from '@/lib/enums';
import { logger } from '@/lib/utils/logger';

// GET - Get all workers or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const designation = searchParams.get('designation');
    const department = searchParams.get('department');
    const hospitalId = searchParams.get('hospitalId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } }
      ];
    }

    if (designation && Object.values(Designation).includes(designation as Designation)) {
      query.designation = designation;
    }

    if (department && Object.values(Department).includes(department as Department)) {
      query.department = department;
    }

    if (hospitalId) {
      query.hospitalIds = hospitalId;
    }

    const workers = await WorkerModel.find(query)
      .populate('hospitalIds', 'name type location')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await WorkerModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: workers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching workers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workers' },
      { status: 500 }
    );
  }
}

// POST - Create a new worker
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    const { name, cnic, cnicIV, designation } = body;

    if (!name || !cnic || !cnicIV || !designation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, cnic, cnicIV, designation'
        },
        { status: 400 }
      );
    }

    // Validate designation enum
    if (!Object.values(Designation).includes(designation)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid designation. Must be one of: ${Object.values(Designation).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate department if provided
    if (body.department && !Object.values(Department).includes(body.department)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid department. Must be one of: ${Object.values(Department).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate gender if provided
    if (body.gender && !Object.values(WorkerGender).includes(body.gender)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid gender. Must be one of: ${Object.values(WorkerGender).join(', ')}`
        },
        { status: 400 }
      );
    }

    const worker = await WorkerModel.create(body);

    logger.info('Worker created:', worker._id);

    return NextResponse.json(
      { success: true, data: worker },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating worker:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create worker' },
      { status: 500 }
    );
  }
}
