// MongoDB Seed Script for SehetYarr
// Run this script in mongosh or a MongoDB GUI like Compass

// --- IDs ---
const userId = ObjectId('691d433e2c95929a79dd0287'); // The user provided in the prompt

const hospitalIds = [
  ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId()
];

const doctorIds = [
  ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId()
];

const patientIds = [
  ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId()
];

const medicalRecordIds = [
  ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId()
];

const facilityIds = [
  ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId()
];

// --- Clear Collections (Except Users) ---
const collections = [
  'hospitals', 'doctors', 'patients', 'appointments', 
  'medicalrecords', 'bills', 'workers', 'facilities', 
  'capacities', 'pharmacies'
];

collections.forEach(collection => {
  db.getCollection(collection).drop();
});

print("Cleared existing data (except users).");

// --- 1. Hospitals ---
// Schema: name, location, contact, type, ownershipType, registrationNumber
db.hospitals.insertMany([
  {
    _id: hospitalIds[0],
    userId: userId, // Linked to your user (Hospital Admin)
    name: "City International Hospital",
    location: {
      area: "Gulberg III",
      city: "Lahore",
      country: "Pakistan",
      latitude: 31.5204,
      longitude: 74.3587
    },
    contact: {
      primaryNumber: "042-111-222-333",
      secondaryNumber: "042-35711222"
    },
    type: "hospital",
    ownershipType: "private",
    registrationNumber: "REG-LHR-001",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: hospitalIds[1],
    userId: ObjectId(),
    name: "General Public Hospital",
    location: {
      area: "F-8 Markaz",
      city: "Islamabad",
      country: "Pakistan",
      latitude: 33.7167,
      longitude: 73.0667
    },
    contact: {
      primaryNumber: "051-9201234",
      secondaryNumber: "051-9205678"
    },
    type: "hospital",
    ownershipType: "public",
    registrationNumber: "REG-ISL-002",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: hospitalIds[2],
    userId: ObjectId(),
    name: "Community Health Clinic",
    location: {
      area: "Clifton Block 4",
      city: "Karachi",
      country: "Pakistan",
      latitude: 24.8607,
      longitude: 67.0011
    },
    contact: {
      primaryNumber: "021-35871234",
      secondaryNumber: ""
    },
    type: "clinic",
    ownershipType: "private",
    registrationNumber: "REG-KHI-003",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: hospitalIds[3],
    userId: ObjectId(),
    name: "Red Crescent Dispensary",
    location: {
      area: "Saddar",
      city: "Rawalpindi",
      country: "Pakistan",
      latitude: 33.5973,
      longitude: 73.0479
    },
    contact: {
      primaryNumber: "051-5551234",
      secondaryNumber: ""
    },
    type: "dispensary",
    ownershipType: "ngo",
    registrationNumber: "REG-RWP-004",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: hospitalIds[4],
    userId: ObjectId(),
    name: "Sheikh Zayed Hospital",
    location: {
      area: "Muslim Town",
      city: "Lahore",
      country: "Pakistan",
      latitude: 31.5102,
      longitude: 74.3156
    },
    contact: {
      primaryNumber: "042-35865731",
      secondaryNumber: "042-35865732"
    },
    type: "hospital",
    ownershipType: "semi-government",
    registrationNumber: "REG-LHR-005",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// --- 2. Doctors ---
db.doctors.insertMany([
  {
    _id: doctorIds[0],
    userId: ObjectId(),
    name: "Dr. Sarah Ahmed",
    gender: "female",
    dateOfBirth: new Date("1985-05-15"),
    cnic: "35202-1234567-8",
    cnicIV: "2030-05-15",
    specialization: "Cardiologist",
    experienceYears: 10,
    subSpecialization: ["Interventional Cardiology"],
    qualifications: ["MBBS", "FCPS"],
    licenseNumber: "PMDC-1001",
    contact: {
      area: "DHA",
      city: "Lahore",
      state: "Punjab",
      primaryNumber: "0300-1234567",
      secondaryNumber: "0321-7654321"
    },
    hospitalIds: [hospitalIds[0], hospitalIds[4]],
    availability: {
      days: ["Monday", "Wednesday", "Friday"],
      timeSlots: [{ start: "09:00", end: "13:00" }]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: doctorIds[1],
    userId: ObjectId(),
    name: "Dr. Ali Khan",
    gender: "male",
    dateOfBirth: new Date("1978-08-20"),
    cnic: "61101-9876543-1",
    cnicIV: "2028-08-20",
    specialization: "Orthopedic Surgeon",
    experienceYears: 15,
    subSpecialization: ["Trauma Surgery"],
    qualifications: ["MBBS", "FRCS"],
    licenseNumber: "PMDC-1002",
    contact: {
      area: "F-8",
      city: "Islamabad",
      state: "Federal",
      primaryNumber: "0333-9876543",
      secondaryNumber: ""
    },
    hospitalIds: [hospitalIds[1]],
    availability: {
      days: ["Tuesday", "Thursday"],
      timeSlots: [{ start: "10:00", end: "14:00" }]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: doctorIds[2],
    userId: ObjectId(),
    name: "Dr. Ayesha Malik",
    gender: "female",
    dateOfBirth: new Date("1990-02-10"),
    cnic: "42201-5555555-2",
    cnicIV: "2032-02-10",
    specialization: "Pediatrician",
    experienceYears: 7,
    subSpecialization: ["Neonatology"],
    qualifications: ["MBBS", "MCPS"],
    licenseNumber: "PMDC-1003",
    contact: {
      area: "Clifton",
      city: "Karachi",
      state: "Sindh",
      primaryNumber: "0321-5555555",
      secondaryNumber: ""
    },
    hospitalIds: [hospitalIds[2]],
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      timeSlots: [{ start: "14:00", end: "18:00" }]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: doctorIds[3],
    userId: ObjectId(),
    name: "Dr. Bilal Hussain",
    gender: "male",
    dateOfBirth: new Date("1982-11-30"),
    cnic: "37405-4444444-3",
    cnicIV: "2029-11-30",
    specialization: "General Physician",
    experienceYears: 12,
    subSpecialization: [],
    qualifications: ["MBBS"],
    licenseNumber: "PMDC-1004",
    contact: {
      area: "Saddar",
      city: "Rawalpindi",
      state: "Punjab",
      primaryNumber: "0300-4444444",
      secondaryNumber: ""
    },
    hospitalIds: [hospitalIds[3]],
    availability: {
      days: ["Monday", "Saturday"],
      timeSlots: [{ start: "09:00", end: "17:00" }]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: doctorIds[4],
    userId: ObjectId(),
    name: "Dr. Fatima Tariq",
    gender: "female",
    dateOfBirth: new Date("1988-07-25"),
    cnic: "35202-6666666-4",
    cnicIV: "2033-07-25",
    specialization: "Dermatologist",
    experienceYears: 8,
    subSpecialization: ["Cosmetic Dermatology"],
    qualifications: ["MBBS", "Dip. Derm"],
    licenseNumber: "PMDC-1005",
    contact: {
      area: "Gulberg",
      city: "Lahore",
      state: "Punjab",
      primaryNumber: "0333-6666666",
      secondaryNumber: ""
    },
    hospitalIds: [hospitalIds[0]],
    availability: {
      days: ["Friday", "Saturday"],
      timeSlots: [{ start: "15:00", end: "19:00" }]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// --- 3. Patients ---
db.patients.insertMany([
  {
    _id: patientIds[0],
    userId: userId, // Linked to your user
    name: "Bilal Khawaja",
    gender: "male",
    dateOfBirth: new Date("1995-01-01"),
    cnic: "35202-1111111-1",
    cnicIV: "2035-01-01",
    bloodGroup: "O+",
    contact: {
      primaryNumber: "0300-5555555",
      secondaryNumber: "0321-5555555",
      address: "House 1, Street 1",
      city: "Lahore",
      state: "Punjab"
    },
    emergencyContact: {
      name: "Father Name",
      relation: "Father",
      phoneNo: "0300-6666666"
    },
    medicalHistory: [
      {
        condition: "Hypertension",
        diagnosedAt: new Date("2020-01-01"),
        status: "active"
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: patientIds[1],
    name: "Jane Doe",
    gender: "female",
    dateOfBirth: new Date("1990-03-10"),
    cnic: "35202-2222222-2",
    cnicIV: "2030-03-10",
    bloodGroup: "A-",
    contact: {
      primaryNumber: "0300-7777777",
      address: "House 2, Street 2",
      city: "Islamabad",
      state: "Federal"
    },
    emergencyContact: {
      name: "John Doe",
      relation: "Husband",
      phoneNo: "0300-8888888"
    },
    medicalHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: patientIds[2],
    name: "Ahmed Raza",
    gender: "male",
    dateOfBirth: new Date("1980-12-12"),
    cnic: "42201-3333333-3",
    cnicIV: "2030-12-12",
    bloodGroup: "B+",
    contact: {
      primaryNumber: "0300-9999999",
      address: "Flat 5, Building A",
      city: "Karachi",
      state: "Sindh"
    },
    emergencyContact: {
      name: "Sara Raza",
      relation: "Wife",
      phoneNo: "0300-1010101"
    },
    medicalHistory: [
      {
        condition: "Diabetes Type 2",
        diagnosedAt: new Date("2018-05-20"),
        status: "active"
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: patientIds[3],
    name: "Fatima Bibi",
    gender: "female",
    dateOfBirth: new Date("1955-06-30"),
    cnic: "37405-4444444-4",
    cnicIV: "2025-06-30",
    bloodGroup: "AB+",
    contact: {
      primaryNumber: "0321-2222222",
      address: "Village XYZ",
      city: "Rawalpindi",
      state: "Punjab"
    },
    emergencyContact: {
      name: "Ali Bibi",
      relation: "Son",
      phoneNo: "0321-3333333"
    },
    medicalHistory: [
      {
        condition: "Arthritis",
        diagnosedAt: new Date("2015-01-01"),
        status: "chronic"
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: patientIds[4],
    name: "Usman Gondal",
    gender: "male",
    dateOfBirth: new Date("2000-09-09"),
    cnic: "35202-5555555-5",
    cnicIV: "2035-09-09",
    bloodGroup: "O-",
    contact: {
      primaryNumber: "0333-4444444",
      address: "Hostel 4, University Road",
      city: "Lahore",
      state: "Punjab"
    },
    emergencyContact: {
      name: "Kamran Gondal",
      relation: "Brother",
      phoneNo: "0333-5555555"
    },
    medicalHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
]);

// --- 4. Appointments ---
db.appointments.insertMany([
  // Patient 1 (Linked User) Appointments
  {
    patientId: patientIds[0],
    doctorId: doctorIds[0],
    hospitalId: hospitalIds[0],
    appointmentDate: new Date(new Date().getTime() + 86400000), // Tomorrow
    status: "Scheduled",
    reason: "Regular Heart Checkup",
    priority: "Normal",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    patientId: patientIds[0],
    doctorId: doctorIds[4],
    hospitalId: hospitalIds[0],
    appointmentDate: new Date(new Date().getTime() - 86400000 * 10), // 10 days ago
    status: "Completed",
    reason: "Skin Rash",
    priority: "Normal",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    patientId: patientIds[0],
    doctorId: doctorIds[0],
    hospitalId: hospitalIds[0],
    appointmentDate: new Date(new Date().getTime() - 86400000 * 30), // 30 days ago
    status: "Completed",
    reason: "Chest Pain",
    priority: "Urgent",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Other Patients
  {
    patientId: patientIds[1],
    doctorId: doctorIds[1],
    hospitalId: hospitalIds[1],
    appointmentDate: new Date(new Date().getTime() + 172800000), // Day after tomorrow
    status: "Scheduled",
    reason: "Knee Pain",
    priority: "Normal",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    patientId: patientIds[2],
    doctorId: doctorIds[2],
    hospitalId: hospitalIds[2],
    appointmentDate: new Date(new Date().getTime() + 259200000), // 3 days later
    status: "Scheduled",
    reason: "Child Vaccination",
    priority: "Normal",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    patientId: patientIds[3],
    doctorId: doctorIds[3],
    hospitalId: hospitalIds[3],
    appointmentDate: new Date(new Date().getTime() - 86400000), // Yesterday
    status: "No Show",
    reason: "General Weakness",
    priority: "Normal",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    patientId: patientIds[4],
    doctorId: doctorIds[4],
    hospitalId: hospitalIds[0],
    appointmentDate: new Date(new Date().getTime() + 604800000), // Next week
    status: "Scheduled",
    reason: "Acne Treatment",
    priority: "Normal",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// --- 5. Medical Records ---
db.medicalrecords.insertMany([
  // Patient 1 Records
  {
    _id: medicalRecordIds[0],
    patientId: patientIds[0],
    doctorId: doctorIds[0],
    hospitalId: hospitalIds[0],
    visitDate: new Date(new Date().getTime() - 86400000 * 30),
    diagnosis: "Mild Angina",
    symptoms: ["Chest Pain", "Shortness of Breath"],
    prescriptions: [
      {
        medicineName: "Aspirin",
        dosage: "75mg",
        frequency: "Once daily",
        duration: "1 month",
        notes: "Take after meal"
      }
    ],
    testsOrdered: [
      {
        testName: "ECG",
        results: "Normal Sinus Rhythm",
        testDate: new Date(new Date().getTime() - 86400000 * 30)
      }
    ],
    allergies: ["Penicillin"],
    treatmentPlan: "Lifestyle modification and medication",
    followUpDate: new Date(new Date().getTime() + 2592000000), // 30 days later
    notes: "Patient advised to reduce salt intake",
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: medicalRecordIds[1],
    patientId: patientIds[0],
    doctorId: doctorIds[4],
    hospitalId: hospitalIds[0],
    visitDate: new Date(new Date().getTime() - 86400000 * 10),
    diagnosis: "Contact Dermatitis",
    symptoms: ["Redness", "Itching"],
    prescriptions: [
      {
        medicineName: "Hydrocortisone Cream",
        dosage: "1%",
        frequency: "Twice daily",
        duration: "1 week",
        notes: "Apply on affected area"
      }
    ],
    testsOrdered: [],
    allergies: ["Penicillin"],
    treatmentPlan: "Topical steroids",
    followUpDate: null,
    notes: "Avoid irritants",
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Other Patients
  {
    _id: medicalRecordIds[2],
    patientId: patientIds[2],
    doctorId: doctorIds[2],
    hospitalId: hospitalIds[2],
    visitDate: new Date(new Date().getTime() - 86400000 * 60),
    diagnosis: "Viral Fever",
    symptoms: ["Fever", "Body Ache"],
    prescriptions: [
      {
        medicineName: "Panadol",
        dosage: "500mg",
        frequency: "SOS",
        duration: "5 days",
        notes: ""
      }
    ],
    testsOrdered: [],
    allergies: [],
    treatmentPlan: "Rest and hydration",
    followUpDate: null,
    notes: "",
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// --- 6. Bills ---
db.bills.insertMany([
  // Patient 1 Bills
  {
    patientId: patientIds[0],
    hospitalId: hospitalIds[0],
    doctorId: doctorIds[0],
    medicalRecordId: medicalRecordIds[0],
    billDate: new Date(new Date().getTime() - 86400000 * 30),
    totalAmount: 5000,
    paidAmount: 5000,
    status: "Paid",
    paymentMethod: "Cash",
    items: [
      {
        description: "Consultation Fee",
        quantity: 1,
        unitPrice: 3000,
        amount: 3000
      },
      {
        description: "ECG",
        quantity: 1,
        unitPrice: 2000,
        amount: 2000
      }
    ],
    discount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    patientId: patientIds[0],
    hospitalId: hospitalIds[0],
    doctorId: doctorIds[4],
    medicalRecordId: medicalRecordIds[1],
    billDate: new Date(new Date().getTime() - 86400000 * 10),
    totalAmount: 2000,
    paidAmount: 0,
    status: "Pending",
    paymentMethod: "Card",
    items: [
      {
        description: "Consultation Fee",
        quantity: 1,
        unitPrice: 2000,
        amount: 2000
      }
    ],
    discount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Other Patients
  {
    patientId: patientIds[2],
    hospitalId: hospitalIds[2],
    doctorId: doctorIds[2],
    medicalRecordId: medicalRecordIds[2],
    billDate: new Date(new Date().getTime() - 86400000 * 60),
    totalAmount: 1500,
    paidAmount: 1500,
    status: "Paid",
    paymentMethod: "Cash",
    items: [
      {
        description: "Consultation Fee",
        quantity: 1,
        unitPrice: 1500,
        amount: 1500
      }
    ],
    discount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// --- 7. Workers ---
db.workers.insertMany([
  {
    name: "Nurse Fatima",
    gender: "Female",
    dateOfBirth: new Date("1992-06-15"),
    cnic: "35202-3333333-3",
    cnicIV: "2032-06-15",
    designation: "Nurse",
    department: "ICU",
    experienceYears: 5,
    qualifications: ["BS Nursing"],
    shift: { type: "Morning", startTime: "08:00", endTime: "16:00" },
    contact: { primaryNumber: "0300-1122334", area: "Gulberg", city: "Lahore", state: "Punjab" },
    hospitalIds: [hospitalIds[0]],
    licenseNumber: "PNC-12345",
    schemes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Technician Ahmed",
    gender: "Male",
    dateOfBirth: new Date("1988-04-20"),
    cnic: "35202-4444444-4",
    cnicIV: "2028-04-20",
    designation: "Technician",
    department: "Laboratory",
    experienceYears: 8,
    qualifications: ["Diploma in Lab Tech"],
    shift: { type: "Evening", startTime: "16:00", endTime: "00:00" },
    contact: { primaryNumber: "0321-5566778", area: "Model Town", city: "Lahore", state: "Punjab" },
    hospitalIds: [hospitalIds[0], hospitalIds[4]],
    licenseNumber: "PNC-67890",
    schemes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Paramedic Zara",
    gender: "Female",
    dateOfBirth: new Date("1995-11-11"),
    cnic: "61101-5555555-5",
    cnicIV: "2035-11-11",
    designation: "Paramedic",
    department: "Emergency",
    experienceYears: 3,
    qualifications: ["Paramedic Course"],
    shift: { type: "Night", startTime: "00:00", endTime: "08:00" },
    contact: { primaryNumber: "0333-9988776", area: "G-9", city: "Islamabad", state: "Federal" },
    hospitalIds: [hospitalIds[1]],
    licenseNumber: "PNC-11223",
    schemes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// --- 8. Facilities ---
db.facilities.insertMany([
  {
    _id: facilityIds[0],
    hospitalId: hospitalIds[0],
    category: "Equipment",
    name: "Ventilator",
    quantity: 10,
    inUse: 5,
    status: "Operational",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: facilityIds[1],
    hospitalId: hospitalIds[0],
    category: "Facility",
    name: "Wheelchair",
    quantity: 20,
    inUse: 2,
    status: "Operational",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: facilityIds[2],
    hospitalId: hospitalIds[1],
    category: "Equipment",
    name: "X-Ray Machine",
    quantity: 2,
    inUse: 1,
    status: "Operational",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: facilityIds[3],
    hospitalId: hospitalIds[2],
    category: "Medication",
    name: "First Aid Kit",
    quantity: 50,
    inUse: 0,
    status: "Operational",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// --- 9. Capacity ---
db.capacities.insertMany([
  {
    hospitalId: hospitalIds[0],
    wardType: "ICU",
    totalBeds: 20,
    occupiedBeds: 15,
    availableBeds: 5,
    equipmentIds: [facilityIds[0]],
    notes: "Critical Care Unit",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    hospitalId: hospitalIds[0],
    wardType: "Normal",
    totalBeds: 100,
    occupiedBeds: 60,
    availableBeds: 40,
    equipmentIds: [facilityIds[1]],
    notes: "General Ward",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    hospitalId: hospitalIds[1],
    wardType: "Emergency",
    totalBeds: 50,
    occupiedBeds: 45,
    availableBeds: 5,
    equipmentIds: [facilityIds[2]],
    notes: "ER",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// --- 10. Pharmacies ---
db.pharmacies.insertMany([
  {
    name: "City Hospital Pharmacy",
    contact: "042-111222333",
    location: {
      address: "Inside City Hospital, Main Lobby",
      city: "Lahore",
      state: "Punjab"
    },
    inventory: [
      { name: "Panadol", supplier: "GSK", quantity: "1000 packs" },
      { name: "Augmentin", supplier: "GSK", quantity: "500 packs" }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Islamabad Central Pharmacy",
    contact: "051-222333444",
    location: {
      address: "Blue Area",
      city: "Islamabad",
      state: "Federal"
    },
    inventory: [
      { name: "Disprin", supplier: "Reckitt", quantity: "2000 packs" },
      { name: "Brufen", supplier: "Abbott", quantity: "1500 packs" }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Karachi Meds",
    contact: "021-333444555",
    location: {
      address: "Tariq Road",
      city: "Karachi",
      state: "Sindh"
    },
    inventory: [
      { name: "Insulin", supplier: "Lilly", quantity: "100 vials" }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("Database seeded successfully with updated schema and expanded data!");
