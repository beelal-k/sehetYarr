'use client';

import { Pharmacy, InventoryItem } from '@/types/pharmacy';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Calendar, 
  Package, 
  Plus, 
  Edit, 
  ArrowLeft,
  Pill,
  Truck,
  Hash
} from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

const inventoryItemSchema = z.object({
  name: z.string().min(1, { message: 'Medicine name is required.' }),
  supplier: z.string().min(1, { message: 'Supplier is required.' }),
  quantity: z.coerce.number().min(0, { message: 'Quantity must be a positive number.' }),
  dosage: z.string().min(1, { message: 'Dosage is required.' })
});

type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

export default function PharmacyDetailView({ pharmacyId }: { pharmacyId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [addInventoryOpen, setAddInventoryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      supplier: '',
      quantity: 0,
      dosage: ''
    }
  });

  useEffect(() => {
    const fetchPharmacy = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pharmacies/${pharmacyId}`,
          { cache: 'no-store' }
        );
        
        const result = await response.json();
        
        if (result.success) {
          const pharmacyData = result.data as Pharmacy;
          
          // Normalize existing inventory items to ensure they have all required fields
          // This handles cases where old data might be missing dosage or have string quantities
          if (pharmacyData.inventory && Array.isArray(pharmacyData.inventory)) {
            pharmacyData.inventory = pharmacyData.inventory
              .filter(item => {
                // First filter: only keep items that have all required fields
                return item && 
                       item.name && 
                       String(item.name).trim() &&
                       item.supplier && 
                       String(item.supplier).trim() &&
                       item.dosage &&
                       String(item.dosage).trim() &&
                       (item.quantity !== undefined && item.quantity !== null);
              })
              .map(item => {
                // Normalize quantity to number
                let quantity = 0;
                if (typeof item.quantity === 'string') {
                  quantity = isNaN(Number(item.quantity)) ? 0 : Number(item.quantity);
                } else if (typeof item.quantity === 'number') {
                  quantity = item.quantity;
                }
                
                // At this point, we know dosage exists (filtered above)
                return {
                  name: String(item.name || '').trim(),
                  supplier: String(item.supplier || '').trim(),
                  quantity: quantity,
                  dosage: String(item.dosage).trim()
                };
              })
              .filter(item => {
                // Final filter: ensure all fields are valid after normalization
                return item.name && 
                       item.supplier && 
                       item.dosage && 
                       typeof item.quantity === 'number' &&
                       item.quantity >= 0;
              });
          }
          
          setPharmacy(pharmacyData);
          // Check if response came from cache (you might need to adjust this based on your API)
          setIsFromCache(response.headers.get('x-from-cache') === 'true');
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Failed to fetch pharmacy:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacy();
  }, [pharmacyId]);

  const handleAddInventory = async (data: InventoryItemFormData) => {
    if (!pharmacy) return;

    try {
      setSubmitting(true);
      
      // Create new inventory item with all required fields
      const newInventoryItem: InventoryItem = {
        name: data.name.trim(),
        supplier: data.supplier.trim(),
        quantity: Number(data.quantity),
        dosage: data.dosage.trim()
      };
      
      // Ensure all existing inventory items are valid (have required fields)
      // Filter out any invalid items and ensure quantity is a number and dosage exists
      const validExistingInventory = (pharmacy.inventory || [])
        .map(item => {
          // Normalize quantity to number
          let quantity = 0;
          if (typeof item.quantity === 'string') {
            quantity = isNaN(Number(item.quantity)) ? 0 : Number(item.quantity);
          } else if (typeof item.quantity === 'number') {
            quantity = item.quantity;
          }
          
          return {
            name: String(item.name || '').trim(),
            supplier: String(item.supplier || '').trim(),
            quantity: quantity,
            dosage: item.dosage ? String(item.dosage).trim() : ''
          };
        })
        .filter(item => {
          // Only keep items that have all required fields with valid values
          const isValid = item.name && 
                         item.name.trim() !== '' &&
                         item.supplier && 
                         item.supplier.trim() !== '' &&
                         item.dosage && 
                         item.dosage.trim() !== '' &&
                         typeof item.quantity === 'number' &&
                         item.quantity >= 0;
          
          if (!isValid) {
            console.warn('Filtering out invalid inventory item:', item);
          }
          
          return isValid;
        });
      
      // Combine existing valid items with the new one
      const updatedInventory = [...validExistingInventory, newInventoryItem];
      
      // Log for debugging
      console.log('Sending inventory update:', {
        existingCount: validExistingInventory.length,
        newItem: newInventoryItem,
        totalCount: updatedInventory.length
      });
      
      // Use PATCH to only update inventory field
      const response = await fetch(`/api/pharmacies/${pharmacyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory: updatedInventory
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPharmacy(result.data as Pharmacy);
        form.reset();
        setAddInventoryOpen(false);
        toast.success('Inventory item added successfully');
        router.refresh();
      } else {
        toast.error(result.error || result.message || 'Failed to add inventory item');
        console.error('API Error:', result);
        console.error('Inventory being sent:', updatedInventory);
      }
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!pharmacy) {
    notFound();
  }

  const fullAddress = `${pharmacy.location.address}, ${pharmacy.location.city}, ${pharmacy.location.state}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pharmacy.name}</h1>
            <p className="text-muted-foreground">Pharmacy Details & Inventory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/pharmacies/${pharmacyId}`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      {isFromCache && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Showing cached data. Changes will sync when you're back online.
          </AlertDescription>
        </Alert>
      )}

      {/* Pharmacy Information Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('common.basic_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {t('common.pharmacy_name')}
              </Label>
              <p className="text-lg font-semibold">{pharmacy.name}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('common.contact')}
              </Label>
              <p className="text-base">{pharmacy.contact}</p>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('common.location')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {t('common.address')}
              </Label>
              <p className="text-base">{pharmacy.location.address}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  {t('common.city')}
                </Label>
                <p className="text-base">{pharmacy.location.city}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  {t('common.state')}
                </Label>
                <p className="text-base">{pharmacy.location.state}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory
                <Badge variant="secondary" className="ml-2">
                  {pharmacy.inventory.length} {pharmacy.inventory.length === 1 ? 'item' : 'items'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Manage medicine inventory for this pharmacy
              </CardDescription>
            </div>
            <Dialog open={addInventoryOpen} onOpenChange={setAddInventoryOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Inventory Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                  <DialogDescription>
                    Add a new medicine to the pharmacy inventory
                  </DialogDescription>
                </DialogHeader>
                <Form form={form} onSubmit={form.handleSubmit(handleAddInventory)}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.medicine_name')}</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Paracetamol" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.supplier')}</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ABC Pharma" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('common.quantity')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="100" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dosage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('common.dosage') || 'Dosage'}</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 200mg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAddInventoryOpen(false);
                          form.reset();
                        }}
                        disabled={submitting}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? t('common.saving') : 'Add Item'}
                      </Button>
                    </DialogFooter>
                  </div>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {pharmacy.inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No inventory items</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by adding your first inventory item
              </p>
              <Button onClick={() => setAddInventoryOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Inventory Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pharmacy.inventory.map((item, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Pill className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold text-lg">{item.name}</h4>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t('common.supplier')}:</span>
                            <span className="font-medium">{item.supplier}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t('common.quantity')}:</span>
                            <Badge variant="outline" className="font-medium">
                              {item.quantity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Pill className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t('common.dosage') || 'Dosage'}:</span>
                            <Badge variant="secondary" className="font-medium">
                              {item.dosage}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Created At</Label>
              <p>{new Date(pharmacy.createdAt).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Last Updated</Label>
              <p>{new Date(pharmacy.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

