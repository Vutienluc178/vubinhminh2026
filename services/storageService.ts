
import { ProblemAnalysis, BankItem, Folder, SavedPresentation, GeneratedProblem } from "../types";

const BANK_KEY = "olympic_math_bank_v1";
const FOLDER_KEY = "olympic_math_folders_v1";
const PRESENTATION_KEY = "olympic_math_presentations_v1";

// --- EXISTING QUESTION BANK ---

export const saveToBank = (problems: ProblemAnalysis[]): void => {
  try {
    const currentBank = getBankItems();
    const newItems: BankItem[] = problems.map(p => ({
      ...p,
      id: crypto.randomUUID(),
      savedAt: Date.now()
    }));
    
    // Prepend new items
    const updatedBank = [...newItems, ...currentBank];
    localStorage.setItem(BANK_KEY, JSON.stringify(updatedBank));
  } catch (error) {
    console.error("Failed to save to bank", error);
    alert("Không thể lưu vào bộ nhớ trình duyệt (Quota exceeded?)");
  }
};

export const getBankItems = (): BankItem[] => {
  try {
    const raw = localStorage.getItem(BANK_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to load bank", error);
    return [];
  }
};

export const deleteFromBank = (id: string): BankItem[] => {
  const currentBank = getBankItems();
  const updatedBank = currentBank.filter(item => item.id !== id);
  localStorage.setItem(BANK_KEY, JSON.stringify(updatedBank));
  return updatedBank;
};

export const clearBank = (): void => {
  localStorage.removeItem(BANK_KEY);
};

export const importToBank = (importedItems: any[]): number => {
    try {
        if (!Array.isArray(importedItems)) {
            throw new Error("Dữ liệu nhập vào không hợp lệ (phải là danh sách).");
        }

        const currentBank = getBankItems();
        const currentIds = new Set(currentBank.map(item => item.id));
        
        // Filter valid items and remove duplicates based on ID
        const validNewItems = importedItems.filter(item => {
            return item.id && item.originalContent && !currentIds.has(item.id);
        }) as BankItem[];

        if (validNewItems.length === 0) return 0;

        // Merge: New items on top
        const updatedBank = [...validNewItems, ...currentBank];
        localStorage.setItem(BANK_KEY, JSON.stringify(updatedBank));
        
        return validNewItems.length;
    } catch (error) {
        console.error("Import failed", error);
        throw error;
    }
};

// --- NEW FOLDER & PRESENTATION SYSTEM ---

export const initializeFolders = (): void => {
    const raw = localStorage.getItem(FOLDER_KEY);
    if (!raw || raw === '[]') {
        const defaultFolders: Folder[] = [
            { id: 'grade-6', name: 'Lớp 6', parentId: null, createdAt: Date.now() },
            { id: 'grade-7', name: 'Lớp 7', parentId: null, createdAt: Date.now() },
            { id: 'grade-8', name: 'Lớp 8', parentId: null, createdAt: Date.now() },
            { id: 'grade-9', name: 'Lớp 9', parentId: null, createdAt: Date.now() },
            { id: 'grade-10', name: 'Lớp 10', parentId: null, createdAt: Date.now() },
            { id: 'grade-11', name: 'Lớp 11', parentId: null, createdAt: Date.now() },
            { id: 'grade-12', name: 'Lớp 12', parentId: null, createdAt: Date.now() },
            { id: 'olympic', name: 'Luyện thi Olympic', parentId: null, createdAt: Date.now() },
        ];
        localStorage.setItem(FOLDER_KEY, JSON.stringify(defaultFolders));
    }
};

export const getFolders = (): Folder[] => {
    initializeFolders(); // Ensure defaults exist
    try {
        const raw = localStorage.getItem(FOLDER_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
};

export const createFolder = (name: string, parentId: string | null): Folder => {
    const folders = getFolders();
    const newFolder: Folder = {
        id: crypto.randomUUID(),
        name,
        parentId,
        createdAt: Date.now()
    };
    localStorage.setItem(FOLDER_KEY, JSON.stringify([...folders, newFolder]));
    return newFolder;
};

export const deleteFolder = (folderId: string): void => {
    // 1. Delete the folder
    let folders = getFolders();
    
    // Helper to find all descendant IDs recursively
    const findDescendants = (parentId: string): string[] => {
        const children = folders.filter(f => f.parentId === parentId);
        let ids = children.map(c => c.id);
        children.forEach(c => {
            ids = [...ids, ...findDescendants(c.id)];
        });
        return ids;
    };

    const idsToDelete = [folderId, ...findDescendants(folderId)];
    
    folders = folders.filter(f => !idsToDelete.includes(f.id));
    localStorage.setItem(FOLDER_KEY, JSON.stringify(folders));

    // 2. Delete presentations in these folders
    let presentations = getPresentations();
    presentations = presentations.filter(p => !idsToDelete.includes(p.folderId));
    localStorage.setItem(PRESENTATION_KEY, JSON.stringify(presentations));
};

export const getPresentations = (): SavedPresentation[] => {
    try {
        const raw = localStorage.getItem(PRESENTATION_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
};

export const savePresentation = (name: string, folderId: string, problems: GeneratedProblem[], reflectionNotes?: string, id?: string): SavedPresentation => {
    const presentations = getPresentations();
    
    if (id) {
        const index = presentations.findIndex(p => p.id === id);
        if (index !== -1) {
            const updatedPres: SavedPresentation = {
                ...presentations[index],
                name,
                folderId,
                problems,
                reflectionNotes,
                updatedAt: Date.now()
            };
            presentations[index] = updatedPres;
            localStorage.setItem(PRESENTATION_KEY, JSON.stringify(presentations));
            return updatedPres;
        }
    }

    const newPres: SavedPresentation = {
        id: crypto.randomUUID(),
        name,
        folderId,
        problems,
        reflectionNotes,
        createdAt: Date.now()
    };
    localStorage.setItem(PRESENTATION_KEY, JSON.stringify([newPres, ...presentations]));
    return newPres;
};

export const deletePresentation = (id: string): void => {
    const presentations = getPresentations();
    const updated = presentations.filter(p => p.id !== id);
    localStorage.setItem(PRESENTATION_KEY, JSON.stringify(updated));
};

// --- FULL SYSTEM BACKUP & RESTORE ---

export const exportFullDatabase = () => {
    return {
        version: 1,
        createdAt: new Date().toISOString(),
        bankItems: getBankItems(),
        folders: getFolders(),
        presentations: getPresentations()
    };
};

export const importFullDatabase = (data: any): { bankCount: number, folderCount: number, presCount: number } => {
    try {
        if (!data || typeof data !== 'object') throw new Error("File không hợp lệ");

        // 1. Bank Items (Questions)
        const currentBank = getBankItems();
        const currentBankIds = new Set(currentBank.map(i => i.id));
        const newBankItems = (data.bankItems || []).filter((i: BankItem) => !currentBankIds.has(i.id));
        if (newBankItems.length > 0) {
            localStorage.setItem(BANK_KEY, JSON.stringify([...newBankItems, ...currentBank]));
        }

        // 2. Folders
        const currentFolders = getFolders();
        const currentFolderIds = new Set(currentFolders.map(f => f.id));
        const newFolders = (data.folders || []).filter((f: Folder) => !currentFolderIds.has(f.id));
        if (newFolders.length > 0) {
            localStorage.setItem(FOLDER_KEY, JSON.stringify([...currentFolders, ...newFolders]));
        }

        // 3. Presentations
        const currentPres = getPresentations();
        const currentPresIds = new Set(currentPres.map(p => p.id));
        const newPres = (data.presentations || []).filter((p: SavedPresentation) => !currentPresIds.has(p.id));
        if (newPres.length > 0) {
            localStorage.setItem(PRESENTATION_KEY, JSON.stringify([...newPres, ...currentPres]));
        }

        return {
            bankCount: newBankItems.length,
            folderCount: newFolders.length,
            presCount: newPres.length
        };
    } catch (error) {
        console.error("Full Import Failed", error);
        throw new Error("Cấu trúc file sao lưu không hợp lệ.");
    }
};
