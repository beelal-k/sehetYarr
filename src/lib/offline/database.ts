import {
  createRxDatabase,
  addRxPlugin,
  RxDatabase,
  RxConflictHandler,
  RxConflictHandlerInput,
  RxCollection,
} from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import {
  patientSchema,
  doctorSchema,
  appointmentSchema,
  hospitalSchema,
  billSchema,
  medicalRecordSchema,
  type PatientDocType,
  type DoctorDocType,
  type AppointmentDocType,
  type HospitalDocType,
  type BillDocType,
  type MedicalRecordDocType,
} from "./schemas";
import { clearRxDatabase, needsMigration } from "./migration";

// Add plugins (only in development for dev-mode)
if (process.env.NODE_ENV === "development") {
  addRxPlugin(RxDBDevModePlugin);
}
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

// Define collection types
export type DatabaseCollections = {
  patients: RxCollection<PatientDocType>;
  doctors: RxCollection<DoctorDocType>;
  appointments: RxCollection<AppointmentDocType>;
  hospitals: RxCollection<HospitalDocType>;
  bills: RxCollection<BillDocType>;
  medical_records: RxCollection<MedicalRecordDocType>;
};

export type SehetYarrDatabase = RxDatabase<DatabaseCollections>;

let dbPromise: Promise<SehetYarrDatabase> | null = null;

/**
 * Create or get existing RxDB database instance
 * Uses Dexie.js as storage engine (IndexedDB wrapper)
 */
export async function getDatabase(): Promise<SehetYarrDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = createDatabase();
  return dbPromise;
}

/**
 * Generic conflict resolution handler
 * Uses timestamp comparison - most recent document wins
 */
function createConflictHandler<T extends { updatedAt: string }>() {
  return (input: RxConflictHandlerInput<T>, _context: string) => {
    const doc1Time = new Date(input.realMasterState.updatedAt).getTime();
    const doc2Time = new Date(input.newDocumentState.updatedAt).getTime();

    if (doc2Time > doc1Time) {
      return Promise.resolve({
        isEqual: false,
        documentData: input.newDocumentState,
      });
    }
    return Promise.resolve({
      isEqual: false,
      documentData: input.realMasterState,
    });
  };
}

async function createDatabase(): Promise<SehetYarrDatabase> {
  console.log("🗄️ Creating RxDB database...");

  const dbName = "sehetyarr_offline_db";

  try {
    // Create database with Dexie storage
    const db = await createRxDatabase<DatabaseCollections>({
      name: dbName,
      storage: wrappedValidateAjvStorage({
        storage: getRxStorageDexie(),
      }),
      multiInstance: true, // Allow multiple tabs
      eventReduce: true, // Better query performance
      cleanupPolicy: {
        // Cleanup deleted documents after 1 day
        minimumDeletedTime: 1000 * 60 * 60 * 24,
        minimumCollectionAge: 1000 * 60 * 60 * 24,
        runEach: 1000 * 60 * 5, // Run every 5 minutes
        awaitReplicationsInSync: true,
        waitForLeadership: true,
      },
    });

    console.log("📦 Adding collections to database...");

    // Add collections with schemas
    await db.addCollections({
      patients: {
        schema: patientSchema,
        conflictHandler: createConflictHandler<PatientDocType>() as any,
      },
      doctors: {
        schema: doctorSchema,
        conflictHandler: createConflictHandler<DoctorDocType>() as any,
      },
      appointments: {
        schema: appointmentSchema,
        conflictHandler: createConflictHandler<AppointmentDocType>() as any,
      },
      hospitals: {
        schema: hospitalSchema,
        conflictHandler: createConflictHandler<HospitalDocType>() as any,
      },
      bills: {
        schema: billSchema,
        conflictHandler: createConflictHandler<BillDocType>() as any,
      },
      medical_records: {
        schema: medicalRecordSchema,
        conflictHandler: createConflictHandler<MedicalRecordDocType>() as any,
      },
    });

    console.log("✅ RxDB database ready!");
    return db;
  } catch (error: any) {
    // Check if this is a schema mismatch error (DB6)
    if (needsMigration(error)) {
      console.warn("⚠️ Schema mismatch detected - clearing old database...");

      // Clear the old database
      await clearRxDatabase(dbName);

      // Reset dbPromise so it can be recreated
      dbPromise = null;

      console.log("🔄 Retrying database creation with new schema...");

      // Retry creating the database (recursive call)
      return createDatabase();
    }

    // If it's not a migration error, rethrow it
    throw error;
  }
}

/**
 * Destroy database (for testing or cache clearing)
 */
export async function destroyDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.remove();
    dbPromise = null;
    console.log("🗑️ Database destroyed");
  }
}

/**
 * Export helper function to check if database exists
 */
export function isDatabaseInitialized(): boolean {
  return dbPromise !== null;
}
