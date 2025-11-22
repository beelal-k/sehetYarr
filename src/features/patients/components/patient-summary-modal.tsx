'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, FileText, Activity, Pill, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/providers/i18n-provider';

interface PatientSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

interface MedicalRecord {
  _id: string;
  visitDate: string;
  diagnosis: string;
  symptoms: string[];
  prescriptions: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  doctorId: {
    name: string;
    specialization: string;
  };
  hospitalId: {
    name: string;
  };
}

export const PatientSummaryModal: React.FC<PatientSummaryModalProps> = ({
  isOpen,
  onClose,
  patient
}) => {
  const { t } = useI18n();
  const [fullPatient, setFullPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    if (isOpen && patient._id) {
      fetchFullPatient();
      fetchMedicalRecords();
    }
  }, [isOpen, patient._id]);

  const fetchFullPatient = async () => {
    try {
      setLoadingPatient(true);
      const response = await fetch(`/api/patients/${patient._id}`);
      const result = await response.json();
      if (result.success) {
        setFullPatient(result.data);
      } else {
        console.error('Failed to fetch full patient data:', result.error);
        // Fallback to the patient data from props
        setFullPatient(patient);
      }
    } catch (error) {
      console.error('Error fetching full patient data:', error);
      // Fallback to the patient data from props
      setFullPatient(patient);
    } finally {
      setLoadingPatient(false);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/medical-records?patientId=${patient._id}&limit=5`
      );
      const data = await response.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch medical records', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {t('common.patient_summary')}: {fullPatient?.name || patient.name}
          </DialogTitle>
          <DialogDescription>
            {t('common.overview_patient_details')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {loadingPatient ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {t('common.personal_info')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.name')}:</span>{' '}
                          {fullPatient?.name || patient.name}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.cnic')}:</span>{' '}
                          {fullPatient?.cnic || patient.cnic || 'N/A'}
                        </p>
                        {fullPatient?.dateOfBirth || patient.dateOfBirth ? (
                          <p className="text-sm">
                            <span className="font-semibold">{t('common.age')}:</span>{' '}
                            {new Date().getFullYear() -
                              new Date(fullPatient?.dateOfBirth || patient.dateOfBirth || new Date()).getFullYear()}
                          </p>
                        ) : null}
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.dob')}:</span>{' '}
                          {fullPatient?.dateOfBirth || patient.dateOfBirth
                            ? format(new Date(fullPatient?.dateOfBirth || patient.dateOfBirth || new Date()), 'PPP')
                            : 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.gender')}:</span>{' '}
                          {fullPatient?.gender || patient.gender || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.blood_group')}:</span>{' '}
                          {fullPatient?.bloodGroup || patient.bloodGroup || 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {t('common.contact_details')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.primary_number')}:</span>{' '}
                          {fullPatient?.contact?.primaryNumber || patient.contact?.primaryNumber || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.secondary_number')}:</span>{' '}
                          {fullPatient?.contact?.secondaryNumber || patient.contact?.secondaryNumber || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.address')}:</span>{' '}
                          {fullPatient?.contact?.address || patient.contact?.address || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.city')}:</span>{' '}
                          {fullPatient?.contact?.city || patient.contact?.city || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.state')}:</span>{' '}
                          {fullPatient?.contact?.state || patient.contact?.state || 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {t('common.emergency_contact')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.name')}:</span>{' '}
                          {fullPatient?.emergencyContact?.name || patient.emergencyContact?.name || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.relation')}:</span>{' '}
                          {fullPatient?.emergencyContact?.relation || patient.emergencyContact?.relation || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{t('common.phone')}:</span>{' '}
                          {fullPatient?.emergencyContact?.phoneNo || patient.emergencyContact?.phoneNo || 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('common.recent_medical_records')}
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : records.length > 0 ? (
                <div className="space-y-4">
                  {records.map((record) => (
                    <Card key={record._id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              {record.diagnosis}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(record.visitDate), 'PPP')}
                            </p>
                          </div>
                          {record.hospitalId && (
                            <Badge variant="outline">{record.hospitalId.name}</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {record.symptoms && record.symptoms.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-1">{t('common.symptoms')}:</p>
                              <div className="flex flex-wrap gap-1">
                                {record.symptoms.map((symptom, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {symptom}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {record.prescriptions && record.prescriptions.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-1 flex items-center gap-1">
                                <Pill className="h-3 w-3" /> {t('common.prescriptions')}:
                              </p>
                              <ul className="text-sm list-disc list-inside text-muted-foreground">
                                {record.prescriptions.map((p, idx) => (
                                  <li key={idx}>
                                    {p.medicineName} - {p.dosage} ({p.frequency})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {record.doctorId && (
                            <div className="pt-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <Stethoscope className="h-4 w-4" />
                              <span>Dr. {record.doctorId.name}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-2 opacity-20" />
                  <p>{t('common.no_medical_records_found')}</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
