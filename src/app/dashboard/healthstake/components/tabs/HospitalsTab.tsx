"use client"

import { useState, useEffect } from "react"
import { 
  Heart,
  Stethoscope,
  Activity,
  AlertCircle
} from "lucide-react"
import HospitalOverview from "../hospitals/HospitalOverview"
import MyDepartment from "../hospitals/MyDepartment"
import FacilitiesSection from "../hospitals/FacilitiesSection"
import MedicalEquipment from "../hospitals/MedicalEquipment"
import DepartmentsSection from "../hospitals/DepartmentsSection"

interface Hospital {
  _id: string
  hospitalName: string
  hospitalAddress?: string
  hospitalLocation?: {
    address?: string
    city?: string
    state?: string
  }
  numberOfBeds?: string
  departments?: any
  ntnNumber: string
  type: string
  hospitalServices?: string[]
  createdAt: string
}

export default function HospitalsTab({ role }: { role: string }) {
  const [editingMachine, setEditingMachine] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string>("overview")
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch hospitals from API
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch('/api/hospitals?limit=10')
        const data = await response.json()
        if (data.success) {
          setHospitals(data.data)
        }
      } catch (error) {
        console.error('Error fetching hospitals:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHospitals()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Use the first hospital or create a default one if no data
  const primaryHospital = hospitals[0] || {
    _id: 'default',
    hospitalName: 'No Hospital Data',
    hospitalAddress: '',
    hospitalLocation: { address: '', city: '', state: '' },
    numberOfBeds: '0',
    ntnNumber: '',
    type: '',
    hospitalServices: [],
    createdAt: new Date().toISOString()
  }

  // Transform API data to component format
  const hospital = {
    name: primaryHospital.hospitalName,
    address: primaryHospital.hospitalLocation?.address || primaryHospital.hospitalAddress || '',
    city: primaryHospital.hospitalLocation?.city || '',
    phone: '+92-42-35905000', // Static for now, add phone field to model if needed
    email: 'info@hospital.pk', // Static for now, add email field to model if needed
    established: new Date(primaryHospital.createdAt).getFullYear().toString(),
    totalBeds: parseInt(primaryHospital.numberOfBeds || '0'),
    occupiedBeds: Math.floor(parseInt(primaryHospital.numberOfBeds || '0') * 0.85), // 85% occupancy estimate
    totalStaff: 450, // Static for now, would need staff API
    totalDepartments: primaryHospital.hospitalServices?.length || 0
  }

  // Health Worker's own data
  const currentWorker = {
    department: "Cardiology",
    joinedDate: "2023-06-15"
  }

  // Transform hospital services to departments
  const departments = (primaryHospital.hospitalServices || []).map((service, index) => ({
    id: `dept-${index}`,
    name: service,
    headOfDepartment: `Dr. ${service} Chief`, // Would need real data from doctors API
    staffCount: Math.floor(Math.random() * 20) + 5, // Random for now
    bedCapacity: Math.floor(parseInt(primaryHospital.numberOfBeds || '0') / (primaryHospital.hospitalServices?.length || 1)),
    occupiedBeds: Math.floor(Math.random() * 15) + 5,
    icon: Stethoscope // Default icon, could map specific icons per department
  }))

  // Transform hospital services to facilities
  const facilities = (primaryHospital.hospitalServices || []).map((service, index) => ({
    id: `facility-${index}`,
    name: `${service} Facility`,
    description: `Advanced ${service} treatment and care facility`,
    available: Math.random() > 0.2 // 80% availability rate
  }))

  // Dynamic colleagues based on current hospital data
  const colleagues = Array.from({ length: 5 }, (_, index) => ({
    id: `colleague-${index}`,
    name: `Dr. ${['Ahmed Khan', 'Sarah Malik', 'Hassan Raza', 'Fatima Ali', 'Ali Ahmed'][index]}`,
    role: ['Head of Department', 'Senior Specialist', 'Specialist', 'Nurse', 'Technician'][index],
    phone: `+92-300-${(1111111 + index * 1111111).toString()}`,
    email: `colleague${index}@${primaryHospital.hospitalName.toLowerCase().replace(/\s+/g, '')}.com`,
    joinedDate: `202${index + 1}-0${index + 1}-15`
  }))

  // Dynamic medical machines based on hospital
  const medicalMachines = [
    {
      id: "1",
      name: "MRI Scanner - Siemens Magnetom",
      department: "Radiology",
      status: "working" as const,
      lastMaintenance: "2024-10-15",
      location: "Building A, Floor 2"
    },
    {
      id: "2",
      name: "CT Scanner - GE Revolution",
      department: "Radiology",
      status: "working" as const,
      lastMaintenance: "2024-11-01",
      location: "Building A, Floor 2"
    },
    {
      id: "3",
      name: "Ventilator - Philips Respironics (Unit 1)",
      department: "ICU",
      status: "working" as const,
      lastMaintenance: "2024-10-28",
      location: "Building B, ICU Ward"
    },
    {
      id: "4",
      name: "Ventilator - Philips Respironics (Unit 2)",
      department: "ICU",
      status: "not-working" as const,
      lastMaintenance: "2024-09-20",
      location: "Building B, ICU Ward"
    },
    {
      id: "5",
      name: "X-Ray Machine - Canon Radnext",
      department: "Emergency",
      status: "maintenance" as const,
      lastMaintenance: "2024-11-10",
      location: "Emergency Wing"
    },
    {
      id: "6",
      name: "Ultrasound - Samsung HS70A",
      department: "Obstetrics",
      status: "working" as const,
      lastMaintenance: "2024-10-28",
      location: "Building C, Floor 1"
    },
    {
      id: "7",
      name: "ECG Machine - Philips PageWriter",
      department: "Cardiology",
      status: "working" as const,
      lastMaintenance: "2024-11-05",
      location: "Building A, Floor 3"
    },
    {
      id: "8",
      name: "Dialysis Machine - Fresenius 4008S",
      department: "Nephrology",
      status: "working" as const,
      lastMaintenance: "2024-10-20",
      location: "Building C, Floor 2"
    },
    {
      id: "9",
      name: "Anesthesia Machine - Dräger Fabius",
      department: "Surgery",
      status: "working" as const,
      lastMaintenance: "2024-11-08",
      location: "Operating Theater 3"
    },
    {
      id: "10",
      name: "Defibrillator - Zoll R Series",
      department: "Emergency",
      status: "not-working" as const,
      lastMaintenance: "2024-10-10",
      location: "Emergency Wing"
    }
  ]

  const handleStatusChange = (machineId: string, newStatus: string) => {
    console.log(`Updating machine ${machineId} to status: ${newStatus}`)
    setEditingMachine(null)
  }

  const handleEditToggle = (machineId: string) => {
    setEditingMachine(editingMachine === machineId ? null : machineId)
  }

  const myDepartment = departments.find(d => d.name === currentWorker.department)

  return (
    <div className="space-y-6">
      {/* Hospital Overview - Shown to both roles */}
      <HospitalOverview hospital={hospital} />

      {/* Health Worker: My Department Section */}
      {role === "Health Worker" && myDepartment && (
        <MyDepartment 
          department={myDepartment} 
          colleagues={colleagues} 
          currentWorker={currentWorker}
        />
      )}

      {/* Management Only: Facilities Section */}
      {role === "Management" && (
        <FacilitiesSection 
          facilities={facilities}
          isExpanded={expandedSection === "facilities"}
          onToggle={() => setExpandedSection(expandedSection === "facilities" ? "" : "facilities")}
        />
      )}

      {/* Management Only: Medical Machines Section */}
      {role === "Management" && (
        <MedicalEquipment 
          machines={medicalMachines}
          isExpanded={expandedSection === "machines"}
          onToggle={() => setExpandedSection(expandedSection === "machines" ? "" : "machines")}
          editingMachine={editingMachine}
          onEditToggle={handleEditToggle}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Management Only: Departments Section */}
      {role === "Management" && (
        <DepartmentsSection 
          departments={departments}
          isExpanded={expandedSection === "departments"}
          onToggle={() => setExpandedSection(expandedSection === "departments" ? "" : "departments")}
        />
      )}
    </div>
  )
}
