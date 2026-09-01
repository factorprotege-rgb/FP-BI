
import { AuditRecord } from '../types';
import { 
  openEnterpriseDB, 
  seedEnterpriseDataIfEmpty, 
  getEnterpriseAudits, 
  saveEnterpriseAudit, 
  deleteAuditFromCloud as dbDeleteAudit,
  getClients,
  saveClient,
  deleteClient,
  getBranches,
  saveBranch,
  deleteBranch,
  getAppUsers
} from './databaseService';

export {
  getClients,
  saveClient,
  deleteClient,
  getBranches,
  saveBranch,
  deleteBranch,
  getAppUsers,
  seedEnterpriseDataIfEmpty
};

// Seed initial database on load
if (typeof window !== 'undefined') {
  seedEnterpriseDataIfEmpty().catch(err => console.error("Error seeding:", err));
}

// --- AUTH MOCK ---

export const loginWithFirebase = async (email: string, pass: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 350));

  const lowerEmail = email.toLowerCase();
  
  if (lowerEmail.includes('error')) {
    throw new Error("Credenciales simuladas inválidas.");
  }

  // Return a mock user object
  return {
    uid: 'local-mock-user-id',
    email: email,
    displayName: email.split('@')[0]
  };
};

export const logoutFirebase = async () => {
  return;
};

// --- DATABASE SERVICE (Enterprise Multi-Store Implementation) ---

export const saveAuditToCloud = async (audit: AuditRecord) => {
  try {
    await saveEnterpriseAudit(audit);
  } catch (e: any) {
    console.error("Enterprise DB Save Error:", e);
    throw new Error("Error guardando en base de datos: " + e.message);
  }
};

export const deleteAuditFromCloud = async (auditId: string) => {
  try {
    const db = await openEnterpriseDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('audits', 'readwrite');
      tx.objectStore('audits').delete(auditId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e: any) {
    throw new Error("Error eliminando de base de datos: " + e.message);
  }
};

export const subscribeToAudits = (callback: (audits: AuditRecord[]) => void) => {
  // Initial load
  getEnterpriseAudits().then(audits => callback(audits));

  // Polling for local reactive updates
  let isFetching = false;
  const interval = setInterval(async () => {
    if (isFetching) return;
    isFetching = true;
    try {
      const audits = await getEnterpriseAudits();
      callback(audits);
    } catch (e) {
      console.error("Polling error:", e);
    } finally {
      isFetching = false;
    }
  }, 2000);

  return () => clearInterval(interval);
};

// --- STORAGE MOCK ---

export const uploadEvidenceToCloud = async (auditId: string, fileBase64: string, fileName: string) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return fileBase64;
};

// Mock exports for compatibility
export const auth = {};
export const db = {};
export const storage = {};

