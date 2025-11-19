import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { PharmacyModel } from '@/lib/models/pharmacy.model';
import { logger } from '@/lib/utils/logger';

// GET - Get all pharmacies or search
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const medicine = searchParams.get('medicine');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = {};

    // Search by pharmacy name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by city
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Filter by state
    if (state) {
      query['location.state'] = { $regex: state, $options: 'i' };
    }

    // Search by medicine in inventory
    if (medicine) {
      query['inventory.name'] = { $regex: medicine, $options: 'i' };
    }

    const pharmacies = await PharmacyModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await PharmacyModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: pharmacies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching pharmacies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pharmacies' },
      { status: 500 }
    );
  }
}

// POST - Create a new pharmacy
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Validate required fields
    const { name, contact, location } = body;

    if (!name || !contact || !location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, contact, location'
        },
        { status: 400 }
      );
    }

    // Validate location fields
    if (!location.address || !location.city || !location.state) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required location fields: address, city, state'
        },
        { status: 400 }
      );
    }

    // Validate inventory if provided
    if (body.inventory && !Array.isArray(body.inventory)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Inventory must be an array'
        },
        { status: 400 }
      );
    }

    // Check if pharmacy with same name and city already exists
    const existingPharmacy = await PharmacyModel.findOne({
      name: { $regex: name, $options: 'i' },
      'location.city': { $regex: location.city, $options: 'i' }
    });

    if (existingPharmacy) {
      return NextResponse.json(
        {
          success: false,
          error: 'A pharmacy with this name already exists in this city'
        },
        { status: 409 }
      );
    }

    const pharmacy = await PharmacyModel.create(body);

    logger.info('Pharmacy created:', pharmacy._id);

    return NextResponse.json(
      { success: true, data: pharmacy },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating pharmacy:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create pharmacy' },
      { status: 500 }
    );
  }
}
