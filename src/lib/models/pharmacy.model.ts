import { Schema, model, models, Document } from 'mongoose';

// Interface for Inventory items
export interface IInventoryItem {
  name: string;
  supplier: string;
  quantity: string;
}

// Interface for Location
export interface IPharmacyLocation {
  address: string;
  city: string;
  state: string;
}

// Interface for Pharmacy document
export interface IPharmacy extends Document {
  _id: string;
  name: string;
  contact: string;
  location: IPharmacyLocation;
  inventory: IInventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema for Inventory items
const InventoryItemSchema = new Schema<IInventoryItem>({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  supplier: {
    type: String,
    required: [true, 'Supplier is required'],
    trim: true
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required'],
    trim: true
  }
}, {
  _id: false // Don't create separate _id for subdocuments
});

// Schema for Location
const PharmacyLocationSchema = new Schema<IPharmacyLocation>({
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  }
}, {
  _id: false // Don't create separate _id for subdocuments
});

// Main Pharmacy Schema
const PharmacySchema = new Schema<IPharmacy>({
  name: {
    type: String,
    required: [true, 'Pharmacy name is required'],
    trim: true,
    maxlength: [200, 'Pharmacy name cannot exceed 200 characters']
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        // Basic validation for Pakistani phone numbers
        return /^(\+92|0)?[0-9]{2,3}-?[0-9]{7,8}$/.test(v);
      },
      message: 'Please enter a valid contact number'
    }
  },
  location: {
    type: PharmacyLocationSchema,
    required: [true, 'Location is required']
  },
  inventory: {
    type: [InventoryItemSchema],
    default: [],
    validate: {
      validator: function(inventory: IInventoryItem[]) {
        return inventory.length >= 0;
      },
      message: 'Inventory must be an array'
    }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'pharmacies' // Explicitly set collection name
});

// Indexes for better query performance
PharmacySchema.index({ name: 1 });
PharmacySchema.index({ 'location.city': 1 });
PharmacySchema.index({ 'location.state': 1 });
PharmacySchema.index({ 'inventory.name': 1 });

// Virtual for full address
PharmacySchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.state}`;
});

// Method to find medicines in inventory
PharmacySchema.methods.findMedicine = function(medicineName: string) {
  return this.inventory.find((item: IInventoryItem) => 
    item.name.toLowerCase().includes(medicineName.toLowerCase())
  );
};

// Method to get inventory count
PharmacySchema.methods.getInventoryCount = function() {
  return this.inventory.length;
};

// Static method to find pharmacies by city
PharmacySchema.statics.findByCity = function(city: string) {
  return this.find({ 'location.city': new RegExp(city, 'i') });
};

// Static method to find pharmacies with specific medicine
PharmacySchema.statics.findByMedicine = function(medicineName: string) {
  return this.find({
    'inventory.name': new RegExp(medicineName, 'i')
  });
};

// Pre-save middleware
PharmacySchema.pre('save', function(next) {
  // Ensure inventory items have valid data
  this.inventory = this.inventory.filter((item: IInventoryItem) => 
    item.name && item.supplier && item.quantity
  );
  next();
});

// Export the model
export const PharmacyModel = models.Pharmacy || model<IPharmacy>('Pharmacy', PharmacySchema);

// Export types
export type Pharmacy = IPharmacy;
export type InventoryItem = IInventoryItem;
export type PharmacyLocation = IPharmacyLocation;
