import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { UserModel } from '@/lib/models/user.model';
import { connectDB } from '@/lib/db/connect';

export const metadata: Metadata = {
  title: 'SehetYarr',
  description: 'Medical Consultation Chatbot Dashboard'
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (user) {
    await connectDB();
    const dbUser = await UserModel.findOne({ clerkId: user.id });
    
    // If user is not in DB or is a guest, redirect to onboarding
    if (!dbUser || dbUser.role === 'guest') {
      redirect('/onboarding');
    }
  }

  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {/* page main content */}
          {children}
          {/* page main content ends */}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
