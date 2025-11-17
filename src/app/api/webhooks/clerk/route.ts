import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/nextjs/server';
import { UserModel } from '@/lib/models/user.model';
import { Role } from '@/lib/enums';
import { connectDB } from '@/lib/db/connect';
import { logger } from '@/lib/utils/logger';

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      verification: {
        status: string;
      };
    }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string;
    phone_numbers: Array<{
      phone_number: string;
      verification: {
        status: string;
      };
    }>;
    unsafe_metadata: Record<string, unknown>;
    public_metadata: Record<string, unknown>;
    private_metadata: Record<string, unknown>;
    created_at: number;
    updated_at: number;
    last_sign_in_at: number | null;
    birthday: string | null;
    gender: string | null;
  };
};

export async function POST(req: NextRequest) {
  logger.info('Webhook received');

  // Get the headers
  const headersList = await headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  logger.info('Webhook headers:', {
    svix_id,
    svix_timestamp,
    has_signature: !!svix_signature
  });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.error('Missing svix headers');
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.text();
  logger.info('Webhook payload length:', payload.length);

  // Check if webhook secret is configured
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    logger.error('CLERK_WEBHOOK_SECRET is not configured');
    return new NextResponse('Webhook secret not configured', {
      status: 500
    });
  }

  // Create a new Svix instance with your webhook secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  let evt: ClerkWebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    }) as ClerkWebhookEvent;
    logger.info('Webhook verified successfully, type:', evt.type);
  } catch (err) {
    logger.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred - invalid signature', {
      status: 400
    });
  }

  // Handle the webhook
  const { type, data } = evt;

  try {
    logger.info('Connecting to database...');
    await connectDB();
    logger.info('Database connected successfully');

    switch (type) {
      case 'user.created':
        logger.info('Handling user.created event for:', data.id);
        await handleUserCreated(data);
        break;
      case 'user.updated':
        logger.info('Handling user.updated event for:', data.id);
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        logger.info('Handling user.deleted event for:', data.id);
        await handleUserDeleted(data);
        break;
      case 'session.created':
        logger.info('Handling session.created event for:', data.id);
        await handleSessionCreated(data);
        break;
      default:
        logger.info(`Unhandled webhook type: ${type}`);
    }

    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    return new NextResponse('Error occurred', { status: 500 });
  }
}

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  logger.info('handleUserCreated called with data:', {
    id: data.id,
    email_count: data.email_addresses?.length || 0,
    first_name: data.first_name,
    last_name: data.last_name
  });

  // If email addresses are missing from webhook, fetch from Clerk API
  let userData = data;
  if (!data.email_addresses || data.email_addresses.length === 0) {
    logger.info('Email addresses missing from webhook, fetching from Clerk API');
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(data.id);
      userData = {
        ...data,
        email_addresses: clerkUser.emailAddresses.map(email => ({
          email_address: email.emailAddress,
          verification: { status: email.verification?.status || 'unverified' }
        })),
        phone_numbers: clerkUser.phoneNumbers?.map(phone => ({
          phone_number: phone.phoneNumber,
          verification: { status: phone.verification?.status || 'unverified' }
        })) || [],
        image_url: clerkUser.imageUrl,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName
      };
      logger.info('Fetched user data from Clerk API successfully');
    } catch (error) {
      logger.error('Failed to fetch user from Clerk API:', error);
      throw new Error('No email address available and failed to fetch from Clerk API');
    }
  }

  const primaryEmail =
    userData.email_addresses.find(
      (email) => email.verification.status === 'verified'
    ) || userData.email_addresses[0];

  if (!primaryEmail) {
    logger.error('No email address found for user:', userData.id);
    throw new Error('No email address found');
  }

  const primaryPhone =
    userData.phone_numbers?.find(
      (phone) => phone.verification.status === 'verified'
    ) || userData.phone_numbers?.[0];

  const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(' ');

  logger.info('Creating user with email:', primaryEmail.email_address);

  try {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ clerkId: userData.id });
    
    if (existingUser) {
      logger.info('User already exists, updating instead:', userData.id);
      await handleUserUpdated(userData);
      return;
    }

    const newUser = await UserModel.create({
      clerkId: userData.id,
      email: primaryEmail.email_address,
      role: Role.STUDENT, // Default role
      name: fullName || undefined,
      profile: {
        firstName: userData.first_name || undefined,
        lastName: userData.last_name || undefined,
        fullName: fullName || undefined,
        imageUrl: userData.image_url || undefined,
        phoneNumber: primaryPhone?.phone_number || undefined,
        birthday: userData.birthday || undefined,
        gender: userData.gender || undefined
      },
      lastSignInAt: userData.last_sign_in_at
        ? new Date(userData.last_sign_in_at)
        : undefined,
      emailVerified: primaryEmail.verification.status === 'verified',
      phoneVerified: primaryPhone?.verification.status === 'verified' || false,
      isActive: true
    });

    logger.info('User created successfully:', {
      clerkId: newUser.clerkId,
      email: newUser.email,
      _id: newUser._id
    });
  } catch (error: any) {
    // Handle duplicate key error
    if (error.code === 11000) {
      logger.warn('Duplicate user detected, updating instead:', userData.id);
      await handleUserUpdated(userData);
      return;
    }
    logger.error('Error creating user:', error);
    throw error;
  }
}

async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  const primaryEmail =
    data.email_addresses.find(
      (email) => email.verification.status === 'verified'
    ) || data.email_addresses[0];

  const primaryPhone =
    data.phone_numbers.find(
      (phone) => phone.verification.status === 'verified'
    ) || data.phone_numbers[0];

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');

  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { clerkId: data.id },
      {
        email: primaryEmail.email_address,
        name: fullName || undefined,
        profile: {
          firstName: data.first_name || undefined,
          lastName: data.last_name || undefined,
          fullName: fullName || undefined,
          imageUrl: data.image_url || undefined,
          phoneNumber: primaryPhone?.phone_number || undefined,
          birthday: data.birthday || undefined,
          gender: data.gender || undefined
        },
        lastSignInAt: data.last_sign_in_at
          ? new Date(data.last_sign_in_at)
          : undefined,
        emailVerified: primaryEmail.verification.status === 'verified',
        phoneVerified:
          primaryPhone?.verification.status === 'verified' || false,
        updatedAt: new Date()
      },
      { new: true, upsert: false }
    );

    if (!updatedUser) {
      logger.info('User not found for update, creating new user');
      await handleUserCreated(data);
    } else {
      logger.info('User updated successfully:', updatedUser.clerkId);
    }
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  try {
    const deletedUser = await UserModel.findOneAndUpdate(
      { clerkId: data.id },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (deletedUser) {
      logger.info('User marked as inactive:', deletedUser.clerkId);
    } else {
      logger.info('User not found for deletion:', data.id);
    }
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
}

async function handleSessionCreated(data: ClerkWebhookEvent['data']) {
  logger.info('handleSessionCreated called for user:', data.id);

  try {
    // Check if user exists in database
    const existingUser = await UserModel.findOne({ clerkId: data.id });

    if (existingUser) {
      // Update last sign-in time
      await UserModel.findOneAndUpdate(
        { clerkId: data.id },
        { 
          lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : new Date(),
          updatedAt: new Date() 
        },
        { new: true }
      );
      logger.info('User last sign-in updated:', data.id);
    } else {
      // User doesn't exist, create them (handles OAuth sign-ins)
      logger.info('User not found during session creation, creating user:', data.id);
      await handleUserCreated(data);
    }
  } catch (error) {
    logger.error('Error handling session creation:', error);
    throw error;
  }
}
