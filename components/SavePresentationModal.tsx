
import React, { useState, useMemo } from 'react';
import { X, Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Save, HardDrive, Edit } from 'lucide-react';
import { Folder as FolderType, SavedPresentation, GeneratedProblem } from '../types';
import { getFolders, createFolder, savePresentation, getPresentations } from '../services/storageService';

interface SavePresentationModalProps {
  onClose: () => void;
  problems: GeneratedProblem[];
  defaultName?: string;
  currentPresentationId?: string | null;
}

export const SavePresentationModal: React.FC<SavePresentationModalProps> = ({ onClose, problems, defaultName, currentPresentationId }) => {
  const [folders, setFolders] = useState<FolderType[]>(getFolders());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(() => {
    if (currentPresentationId) {
        const pres = getPresentations().find(p => p.id === currentPresentationId);
        return pres ? pres.folderId : null;
    }
    return null;
  });
  const [fileName, setFileName] = useState(() => {
    if (currentPresentationId) {
        const pres = getPresentations().find(p => p.id === currentPresentationId);
        if (pres) return pres.name;
    }
    return defaultName || `Bài giảng ${new Date().toLocaleDateString('vi-VN')}`;
  });
  const [reflectionNotes, setReflectionNotes] = useState(() => {
    if (currentPresentationId) {
        const pres = getPresentations().find(p => p.id === currentPresentationId);
        if (pres) return pres.reflectionNotes || '';
    }
    return '';
  });
  const [saveMode, setSaveMode] = useState<'NEW' | 'OVERWRITE'>(currentPresentationId ? 'OVERWRITE' : 'NEW');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Tree expansion state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedFolders);
    if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
    setExpandedFolders(next);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    // If no folder selected, create at root (conceptually, though UI might restrict this if desired)
    // Actually better to force user to select a parent if they are deep in hierarchy, 
    // or just allow root creation if nothing selected.
    // For specific requirement "from Grade 6-12", roots are fixed, users usually create sub-folders.
    
    // If no parent selected, we can't easily guess which grade root. 
    // So let's require selection if we want to make it a child. 
    // If selectedFolderId is null, we create a new Root (or user shouldn't be allowed).
    // Let's assume user creates subfolders inside the grade folders.
    
    if (!selectedFolderId) {
        alert("Vui lòng chọn một thư mục cha (ví dụ: Lớp 6) để tạo thư mục con.");
        return;
    }

    createFolder(newFolderName, selectedFolderId);
    setFolders(getFolders()); // Refresh
    setNewFolderName('');
    setIsCreatingFolder(false);
    // Auto expand parent
    const next = new Set(expandedFolders);
    next.add(selectedFolderId);
    setExpandedFolders(next);
  };

  const handleSave = () => {
    if (!selectedFolderId) {
        alert("Vui lòng chọn thư mục lưu trữ.");
        return;
    }
    if (!fileName.trim()) {
        alert("Vui lòng nhập tên bài giảng.");
        return;
    }
    
    const idToUse = saveMode === 'OVERWRITE' ? (currentPresentationId || undefined) : undefined;
    savePresentation(fileName, selectedFolderId, problems, reflectionNotes, idToUse);
    alert(saveMode === 'OVERWRITE' ? "Đã cập nhật bài giảng thành công!" : "Đã lưu bài giảng mới vào Ngân hàng thành công!");
    onClose();
  };

  // Recursive Tree Renderer
  const renderTree = (parentId: string | null, level: number = 0) => {
    const children = folders.filter(f => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
    
    if (children.length === 0) return null;

    return (
        <div className="flex flex-col gap-1">
            {children.map(folder => {
                const isExpanded = expandedFolders.has(folder.id);
                const isSelected = selectedFolderId === folder.id;
                const hasChildren = folders.some(f => f.parentId === folder.id);

                return (
                    <div key={folder.id}>
                        <div 
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-700'}`}
                            style={{ paddingLeft: `${level * 20 + 8}px` }}
                            onClick={() => setSelectedFolderId(folder.id)}
                        >
                            <button 
                                onClick={(e) => toggleExpand(folder.id, e)} 
                                className={`p-1 rounded hover:bg-slate-200 ${hasChildren ? 'visible' : 'invisible'}`}
                            >
                                {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </button>
                            
                            {isExpanded ? <FolderOpen size={18} className={isSelected ? "fill-indigo-200" : "fill-yellow-200 text-yellow-500"} /> : <Folder size={18} className={isSelected ? "fill-indigo-200" : "fill-yellow-200 text-yellow-500"} />}
                            <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>{folder.name}</span>
                        </div>
                        
                        {isExpanded && renderTree(folder.id, level + 1)}
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp max-h-[80vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
                <HardDrive className="text-emerald-400" size={24} />
                <div>
                    <h2 className="text-lg font-bold">Lưu vào Ngân hàng</h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Cây thư mục Lớp 6 - 12</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Tree Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 border-b border-slate-200">
            {renderTree(null)}
        </div>

        {/* Controls */}
        <div className="p-6 bg-white space-y-4 shrink-0">
            
            {/* Save Mode Selection */}
            {currentPresentationId && (
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-2">
                    <button 
                        onClick={() => setSaveMode('OVERWRITE')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${saveMode === 'OVERWRITE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        LƯU ĐÈ (CẬP NHẬT)
                    </button>
                    <button 
                        onClick={() => setSaveMode('NEW')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${saveMode === 'NEW' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        LƯU MỚI
                    </button>
                </div>
            )}

            {/* New Folder UI */}
            {isCreatingFolder ? (
                <div className="flex gap-2 animate-fadeIn">
                    <input 
                        className="flex-1 border-2 border-indigo-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                        placeholder="Tên thư mục mới..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        autoFocus
                    />
                    <button onClick={handleCreateFolder} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">Tạo</button>
                    <button onClick={() => setIsCreatingFolder(false)} className="text-slate-400 hover:text-slate-600 px-2"><X size={18}/></button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsCreatingFolder(true)} 
                    disabled={!selectedFolderId}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={16}/> Tạo thư mục con
                </button>
            )}

            {/* File Name */}
            <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tên bài giảng</label>
                <input 
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Nhập tên bài giảng..."
                />
            </div>

            {/* Reflection Notes */}
            <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Edit size={14} /> Rút kinh nghiệm
                </label>
                <textarea 
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all min-h-[80px] resize-none"
                    value={reflectionNotes}
                    onChange={(e) => setReflectionNotes(e.target.value)}
                    placeholder="Nhập phần rút kinh nghiệm cho bài giảng này..."
                />
            </div>

            {/* Save Button */}
            <button 
                onClick={handleSave}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
                <Save size={18}/> Lưu Bài Giảng
            </button>
        </div>
      </div>
    </div>
  );
};
