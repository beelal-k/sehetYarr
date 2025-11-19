'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Stethoscope, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const [role, setRole] = useState<'hospital' | 'doctor' | 'patient' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  // Hospital Form State
  const [hospitalData, setHospitalData] = useState({
    name: '',
    type: 'hospital',
    ownershipType: 'private',
    registrationNumber: '',
    location: { area: '', city: '', country: 'Pakistan' },
    contact: { primaryNumber: '' }
  });

  // Doctor Form State
  const [doctorData, setDoctorData] = useState({
    name: '',
    gender: 'male',
    cnic: '',
    cnicIV: '',
    specialization: '',
    licenseNumber: '',
    contact: { primaryNumber: '', city: '' }
  });

  // Patient Form State
  const [patientData, setPatientData] = useState({
    name: '',
    gender: 'male',
    dateOfBirth: '',
    cnic: '',
    cnicIV: '',
    contact: { primaryNumber: '' }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        role,
        data: role === 'hospital' ? hospitalData : role === 'doctor' ? doctorData : patientData
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success('Profile created successfully!');
      
      // Reload user to get updated metadata/claims
      await user?.reload();
      
      // Force a hard reload to update the session with new claims
      window.location.href = '/dashboard/overview';
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-800 p-4">
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl w-full">
          <Card 
            className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
            onClick={() => setRole('hospital')}
          >
            <CardHeader className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle>Register as Hospital</CardTitle>
              <CardDescription>Manage your facility, doctors, and patients.</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
            onClick={() => setRole('doctor')}
          >
            <CardHeader className="text-center">
              <Stethoscope className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle>Register as Doctor</CardTitle>
              <CardDescription>Manage your appointments and medical records.</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
            onClick={() => setRole('patient')}
          >
            <CardHeader className="text-center">
              <User className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle>Register as Patient</CardTitle>
              <CardDescription>Book appointments and view your medical history.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <Button variant="ghost" onClick={() => setRole(null)} className="w-fit mb-2 pl-0 hover:bg-transparent">
            ← Back
          </Button>
          <CardTitle>
            {role === 'hospital' ? 'Hospital Registration' : 
             role === 'doctor' ? 'Doctor Registration' : 
             'Patient Registration'}
          </CardTitle>
          <CardDescription>Please fill in your details to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'hospital' ? (
              <>
                <div className="grid gap-2">
                  <Label>Hospital Name</Label>
                  <Input 
                    required 
                    value={hospitalData.name}
                    onChange={(e) => setHospitalData({...hospitalData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select 
                      value={hospitalData.type} 
                      onValueChange={(val) => setHospitalData({...hospitalData, type: val})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="dispensary">Dispensary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Ownership</Label>
                    <Select 
                      value={hospitalData.ownershipType} 
                      onValueChange={(val) => setHospitalData({...hospitalData, ownershipType: val})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="semi-government">Semi-Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Registration Number</Label>
                  <Input 
                    required 
                    value={hospitalData.registrationNumber}
                    onChange={(e) => setHospitalData({...hospitalData, registrationNumber: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>City</Label>
                    <Input 
                      required 
                      value={hospitalData.location.city}
                      onChange={(e) => setHospitalData({
                        ...hospitalData, 
                        location: { ...hospitalData.location, city: e.target.value }
                      })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone Number</Label>
                    <Input 
                      required 
                      value={hospitalData.contact.primaryNumber}
                      onChange={(e) => setHospitalData({
                        ...hospitalData, 
                        contact: { ...hospitalData.contact, primaryNumber: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </>
            ) : role === 'doctor' ? (
              <>
                 <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input 
                    required 
                    value={doctorData.name}
                    onChange={(e) => setDoctorData({...doctorData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Specialization</Label>
                    <Input 
                      required 
                      value={doctorData.specialization}
                      onChange={(e) => setDoctorData({...doctorData, specialization: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>License Number (PMDC)</Label>
                    <Input 
                      required 
                      value={doctorData.licenseNumber}
                      onChange={(e) => setDoctorData({...doctorData, licenseNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                    <Label>CNIC</Label>
                    <Input 
                      required 
                      placeholder="12345-1234567-1"
                      value={doctorData.cnic}
                      onChange={(e) => setDoctorData({...doctorData, cnic: e.target.value})}
                    />
                  </div>
                   <div className="grid gap-2">
                    <Label>CNIC Issue Date</Label>
                    <Input 
                      required 
                      type="date"
                      value={doctorData.cnicIV}
                      onChange={(e) => setDoctorData({...doctorData, cnicIV: e.target.value})}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input 
                    required 
                    value={patientData.name}
                    onChange={(e) => setPatientData({...patientData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Gender</Label>
                    <Select 
                      value={patientData.gender} 
                      onValueChange={(val) => setPatientData({...patientData, gender: val})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Date of Birth</Label>
                    <Input 
                      required 
                      type="date"
                      value={patientData.dateOfBirth}
                      onChange={(e) => setPatientData({...patientData, dateOfBirth: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                    <Label>CNIC</Label>
                    <Input 
                      required 
                      placeholder="12345-1234567-1"
                      value={patientData.cnic}
                      onChange={(e) => setPatientData({...patientData, cnic: e.target.value})}
                    />
                  </div>
                   <div className="grid gap-2">
                    <Label>CNIC Issue Date</Label>
                    <Input 
                      required 
                      type="date"
                      value={patientData.cnicIV}
                      onChange={(e) => setPatientData({...patientData, cnicIV: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                    <Label>Phone Number</Label>
                    <Input 
                      required 
                      placeholder="0300-1234567"
                      value={patientData.contact.primaryNumber}
                      onChange={(e) => setPatientData({
                        ...patientData, 
                        contact: { ...patientData.contact, primaryNumber: e.target.value }
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      This phone number will be used to sync your existing medical records.
                    </p>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
