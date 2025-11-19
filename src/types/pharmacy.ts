// Inventory item interface
export interface InventoryItem {
  name: string;
  supplier: string;
  quantity: string;
}

// Pharmacy location interface
export interface PharmacyLocation {
  address: string;
  city: string;
  state: string;
}

// Main pharmacy interface
export interface Pharmacy {
  _id: string;
  name: string;
  contact: string;
  location: PharmacyLocation;
  inventory: InventoryItem[];
  createdAt: string;
  updatedAt: string;
}

// Pharmacy list response interface
export interface PharmacyListResponse {
  pharmacies: Pharmacy[];
  total: number;
  page: number;
  limit: number;
}

// Pharmacy search filters interface
export interface PharmacySearchFilters {
  search?: string;
  city?: string;
  state?: string;
  medicine?: string;
  page?: number;
  limit?: number;
}

// Medicine search result interface
export interface MedicineSearchResult {
  pharmacy: Pharmacy;
  medicine: InventoryItem;
  distance?: number; // Optional distance if location-based search
}

// Pharmacy statistics interface
export interface PharmacyStats {
  totalPharmacies: number;
  totalMedicines: number;
  topCities: Array<{
    city: string;
    count: number;
  }>;
  topSuppliers: Array<{
    supplier: string;
    count: number;
  }>;
}

// Create/Update pharmacy request interface
export interface PharmacyFormData {
  name: string;
  contact: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  inventory: Array<{
    name: string;
    supplier: string;
    quantity: string;
  }>;
}

// Pharmacy API response interface
export interface PharmacyApiResponse {
  success: boolean;
  data?: Pharmacy | Pharmacy[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
