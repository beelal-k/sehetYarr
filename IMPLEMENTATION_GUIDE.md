# Healthcare Models UI Implementation Guide

This document provides the complete pattern for implementing UI components for all healthcare models.

## ✅ Completed Models
1. **Hospitals** - Full CRUD UI with type and ownership filters
2. **Patients** - Full CRUD UI with gender and blood group filters

## 📋 Pattern Structure

For each model, create the following files:

### 1. Type Definition
**File**: `src/types/{model}.ts`
```typescript
export interface {Model} {
  _id: string;
  // ... all model fields
  createdAt: string;
  updatedAt: string;
}

export interface {Model}ListResponse {
  {models}: {Model}[];
  total: number;
  page: number;
  limit: number;
}
```

### 2. Listing Component
**File**: `src/features/{models}/components/{models}-listing.tsx`
- Fetches data from API with pagination
- Manages search params (page, perPage, filters)
- Returns Table component with data

### 3. Table Component
**File**: `src/features/{models}/components/{models}-tables/index.tsx`
- Wraps DataTable with DataTableToolbar
- Uses useDataTable hook for state management

### 4. Column Definitions
**File**: `src/features/{models}/components/{models}-tables/columns.tsx`
- Define all table columns with DataTableColumnHeader
- Add filters using `meta` property:
  - `variant: 'text'` for search
  - `variant: 'multiSelect'` for enum filters
- Include CellAction component

### 5. Cell Actions
**File**: `src/features/{models}/components/{models}-tables/cell-action.tsx`
- Edit action: Navigate to `/dashboard/{models}/{id}`
- Delete action: Call DELETE API endpoint

### 6. Form Component
**File**: `src/features/{models}/components/{model}-form.tsx`
- Zod schema matching API validation
- React Hook Form with form components
- Handles both create and update
- Transforms nested data structures

### 7. View Page Component
**File**: `src/features/{models}/components/{model}-view-page.tsx`
- Fetches single record for edit
- Handles 'new' route for create
- Returns Form component

### 8. List Page
**File**: `src/app/dashboard/{models}/page.tsx`
- PageContainer with heading and "Add New" button
- Suspense wrapper with DataTableSkeleton
- Renders listing component

### 9. Form Page
**File**: `src/app/dashboard/{models}/[{model}Id]/page.tsx`
- PageContainer with FormCardSkeleton
- Renders view page component

## 🔨 Remaining Models to Implement

### 3. Doctors
**Fields**: name, cnic, specialization, qualification, experience, hospitalId, contact, schedule
**Filters**: specialization (text), hospital (multiSelect if you fetch list)
**Special**: Populate hospitalId, display hospital name

### 4. Workers
**Fields**: name, cnic, designation, department, hospitalId, contact, salary, joinDate, shift
**Filters**: designation (multiSelect), department (multiSelect)
**Enums**: Designation, Department, ShiftType

### 5. Appointments
**Fields**: patientId, doctorId, hospitalId, appointmentDate, timeSlot, status, priority, reason, notes
**Filters**: status (multiSelect), priority (multiSelect), date range
**Enums**: AppointmentStatus, Priority
**Special**: Populate and display patient, doctor, hospital names

### 6. Medical Records
**Fields**: patientId, doctorId, hospitalId, diagnosis, treatment, prescriptions, tests, attachments, visitDate
**Special**: Populate all relationships, display rich data, handle arrays (prescriptions, tests, attachments)

### 7. Bills
**Fields**: patientId, hospitalId, appointmentId, totalAmount, paidAmount, remainingAmount, paymentMethod, status, items
**Filters**: status (multiSelect - BillStatus), paymentMethod (multiSelect)
**Special**: Calculate and display remainingAmount, handle items array

### 8. Facilities
**Fields**: name, category, hospitalId, quantity, inUse, status, lastMaintenanceDate
**Filters**: category (multiSelect - FacilityCategory), status (multiSelect - FacilityStatus)
**Special**: Show usage stats (inUse/quantity), populate hospital

### 9. Capacity
**Fields**: hospitalId, wardType, totalBeds, occupiedBeds, availableBeds, equipment
**Filters**: wardType (multiSelect - WardType)
**Special**: Calculate occupancy percentage, availableBeds is auto-calculated, populate hospital

## 📝 Form Component Pattern

```typescript
const formSchema = z.object({
  // Required fields
  name: z.string().min(2, { message: 'Name required' }),
  
  // Enums
  type: z.enum(['value1', 'value2']),
  
  // Numbers
  amount: z.number().min(0),
  
  // Dates
  date: z.date(),
  
  // Nested objects (use dot notation)
  'contact.phone': z.string().optional(),
  
  // ObjectIds (for relationships)
  hospitalId: z.string().min(1, { message: 'Hospital required' })
});

// For ObjectId fields, use Select with fetched options:
const [hospitals, setHospitals] = useState([]);
useEffect(() => {
  fetch('/api/hospitals').then(r => r.json()).then(d => {
    setHospitals(d.data.hospitals.map(h => ({
      label: h.name,
      value: h._id
    })));
  });
}, []);
```

## 🎯 Column Filters Example

```typescript
{
  accessorKey: 'status',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title='Status' />
  ),
  cell: ({ row }) => (
    <div className='capitalize'>{row.getValue('status')}</div>
  ),
  meta: {
    label: 'Status',
    placeholder: 'Filter by status',
    variant: 'multiSelect',
    options: [
      { label: 'Pending', value: 'Pending' },
      { label: 'Completed', value: 'Completed' }
    ]
  },
  filterFn: (row, id, value) => value.includes(row.getValue(id))
}
```

## 🔗 Enum Reference
All enums are in `src/lib/enums/index.ts`:
- HospitalType, OwnershipType
- Gender, BloodGroup
- Designation, Department, ShiftType
- AppointmentStatus, Priority
- BillStatus, PaymentMethod
- FacilityCategory, FacilityStatus
- WardType

## 🚀 Quick Implementation Steps

1. Create type definition
2. Copy hospitals or patients folder structure
3. Rename all files and imports
4. Update interfaces and API endpoints
5. Modify columns based on model fields
6. Update form schema and fields
7. Add appropriate filters
8. Create page routes
9. Test CRUD operations

## ✨ Tips
- Use `format` from `date-fns` for date display
- For currency, use `Intl.NumberFormat`
- For relationships, fetch options in form component
- Add loading states for better UX
- Handle optional fields appropriately
- Use toast notifications for feedback
