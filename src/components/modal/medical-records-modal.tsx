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
import { format } from 'date-fns';
import { Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MedicalRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

interface MedicalRecord {
  _id: string;
  visitDate: string;
  diagnosis: string;
  doctor: { name: string; specialization: string };
  hospital: { name: string };
  symptoms: string[];
  prescriptions: any[];
}

export const MedicalRecordsModal: React.FC<MedicalRecordsModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName
}) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patientId) {
      const fetchRecords = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/medical-records?patientId=${patientId}`);
          const data = await res.json();
          if (data.success) {
            setRecords(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch records', error);
        } finally {
          setLoading(false);
        }
      };
      fetchRecords();
    }
  }, [isOpen, patientId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Medical History: {patientName}</DialogTitle>
          <DialogDescription>
            Recent medical records and visits.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No medical records found.
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <Card key={record._id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {record.diagnosis}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.visitDate), 'PPP')}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {/* @ts-ignore - populated fields might differ slightly */}
                        {record.doctorId?.name || 'Unknown Doctor'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Symptoms: </span>
                        {record.symptoms.join(', ')}
                      </div>
                      {record.prescriptions && record.prescriptions.length > 0 && (
                        <div>
                          <span className="font-medium">Prescription: </span>
                          {record.prescriptions.length} medicines prescribed
                        </div>
                      )}
                       {/* @ts-ignore */}
                      {record.hospitalId?.name && (
                         <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {/* @ts-ignore */}
                            {record.hospitalId.name}
                         </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
