import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Define route access rules based on roles
const routeAccess = {
  admin: ['/dashboard(.*)'],
  hospital: [
    '/dashboard/overview',
    '/dashboard/profile',
    '/dashboard/appointments',
    '/dashboard/patients',
    '/dashboard/doctors',
    '/dashboard/facilities',
    '/dashboard/capacity',
    '/dashboard/bills',
    '/dashboard/workers',
    '/dashboard/pharmacy'
  ],
  doctor: [
    '/dashboard/overview',
    '/dashboard/profile',
    '/dashboard/appointments',
    '/dashboard/patients',
    '/dashboard/medical-records',
    '/dashboard/chat',
    '/dashboard/hospitals',
    '/dashboard/doctors'
  ],
  worker: [
    '/dashboard/overview',
    '/dashboard/profile',
    '/dashboard/appointments',
    '/dashboard/patients',
    '/dashboard/bills',
    '/dashboard/capacity',
    '/dashboard/facilities',
    '/dashboard/hospitals',
    '/dashboard/doctors',
    '/dashboard/kanban'
  ],
  patient: [
    '/dashboard/overview',
    '/dashboard/profile',
    '/dashboard/appointments',
    '/dashboard/medical-records',
    '/dashboard/bills',
    '/dashboard/chat',
    '/dashboard/doctors',
    '/dashboard/hospitals',
    '/dashboard/product'
  ]
};

export default clerkMiddleware(async (auth, req) => {
  // Initialize response as next() by default
  let response = NextResponse.next();

  if (isProtectedRoute(req)) {
    await auth.protect();
    
    const { sessionClaims } = await auth();
    
    // Get role from session claims (support various locations)
    const role = (sessionClaims?.public_metadata as any)?.role || 
                 (sessionClaims?.metadata as any)?.role || 
                 (sessionClaims as any)?.role;

    // If user is explicitly a guest, redirect to onboarding
    // If role is missing, we let them pass to dashboard layout which will check DB
    if (role === 'guest') {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    const path = req.nextUrl.pathname;
    
    // If we have a role, enforce RBAC
    if (role && role !== 'admin') {
      // Check access for other roles
      const allowedRoutes = routeAccess[role as keyof typeof routeAccess];

      if (!allowedRoutes) {
        // If role exists but has no routes defined, maybe invalid role?
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
      
      // Check if current path starts with any allowed route
      const hasAccess = allowedRoutes.some(route => {
        if (route.includes('(.*)')) {
          const base = route.replace('(.*)', '');
          return path.startsWith(base);
        }
        return path === route || path.startsWith(`${route}/`);
      });

      if (!hasAccess) {
        // If trying to access a restricted page, redirect to their allowed home
        // For now, redirect to overview if allowed, otherwise root
        if (allowedRoutes.includes('/dashboard/overview')) {
          // Avoid redirect loop if already on overview
          if (path !== '/dashboard/overview') {
            response = NextResponse.redirect(new URL('/dashboard/overview', req.url));
          }
        } else {
          response = NextResponse.redirect(new URL('/', req.url));
        }
      }
    }
  }

  // Set serviceToken cookie if authenticated
  try {
    const authObj = await auth();
    if (authObj.userId) {
      const token = await authObj.getToken();
      if (token) {
        response.cookies.set('serviceToken', token);
      }
    } else {
      response.cookies.delete('serviceToken');
    }
  } catch (error) {
    console.error('Error setting serviceToken:', error);
  }

  return response;
});
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
