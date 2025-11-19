import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { PharmacyModel } from '@/lib/models/pharmacy.model';
import { logger } from '@/lib/utils/logger';
import { isValidObjectId } from 'mongoose';

// GET - Get pharmacy by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pharmacy ID' },
        { status: 400 }
      );
    }

    const pharmacy = await PharmacyModel.findById(id);

    if (!pharmacy) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pharmacy
    });
  } catch (error) {
    logger.error('Error fetching pharmacy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pharmacy' },
      { status: 500 }
    );
  }
}

// PUT - Update pharmacy by ID (complete replacement)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pharmacy ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate required fields for complete update
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

    // Check if pharmacy exists
    const existingPharmacy = await PharmacyModel.findById(id);
    if (!existingPharmacy) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name in same city (excluding current pharmacy)
    const duplicatePharmacy = await PharmacyModel.findOne({
      _id: { $ne: id },
      name: { $regex: name, $options: 'i' },
      'location.city': { $regex: location.city, $options: 'i' }
    });

    if (duplicatePharmacy) {
      return NextResponse.json(
        {
          success: false,
          error: 'A pharmacy with this name already exists in this city'
        },
        { status: 409 }
      );
    }

    const updatedPharmacy = await PharmacyModel.findByIdAndUpdate(
      id,
      body,
      {
        new: true,
        runValidators: true,
        overwrite: true // Complete replacement
      }
    );

    logger.info('Pharmacy updated (PUT):', updatedPharmacy?._id);

    return NextResponse.json({
      success: true,
      data: updatedPharmacy,
      message: 'Pharmacy updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating pharmacy:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update pharmacy' },
      { status: 500 }
    );
  }
}

// PATCH - Partial update pharmacy by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pharmacy ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Check if body is empty
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Validate location fields if location is being updated
    if (body.location) {
      const location = body.location;
      if (location.address === '' || location.city === '' || location.state === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Location fields cannot be empty'
          },
          { status: 400 }
        );
      }
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

    // Check if pharmacy exists
    const existingPharmacy = await PharmacyModel.findById(id);
    if (!existingPharmacy) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name in same city (excluding current pharmacy) if name or location is being updated
    if (body.name || body.location?.city) {
      const nameToCheck = body.name || existingPharmacy.name;
      const cityToCheck = body.location?.city || existingPharmacy.location.city;
      
      const duplicatePharmacy = await PharmacyModel.findOne({
        _id: { $ne: id },
        name: { $regex: nameToCheck, $options: 'i' },
        'location.city': { $regex: cityToCheck, $options: 'i' }
      });

      if (duplicatePharmacy) {
        return NextResponse.json(
          {
            success: false,
            error: 'A pharmacy with this name already exists in this city'
          },
          { status: 409 }
        );
      }
    }

    const updatedPharmacy = await PharmacyModel.findByIdAndUpdate(
      id,
      { $set: body },
      {
        new: true,
        runValidators: true
      }
    );

    logger.info('Pharmacy updated (PATCH):', updatedPharmacy?._id);

    return NextResponse.json({
      success: true,
      data: updatedPharmacy,
      message: 'Pharmacy updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating pharmacy:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update pharmacy' },
      { status: 500 }
    );
  }
}

// DELETE - Delete pharmacy by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pharmacy ID' },
        { status: 400 }
      );
    }

    const deletedPharmacy = await PharmacyModel.findByIdAndDelete(id);

    if (!deletedPharmacy) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    logger.info('Pharmacy deleted:', deletedPharmacy._id);

    return NextResponse.json({
      success: true,
      message: 'Pharmacy deleted successfully',
      data: deletedPharmacy
    });
  } catch (error) {
    logger.error('Error deleting pharmacy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete pharmacy' },
      { status: 500 }
    );
  }
}
