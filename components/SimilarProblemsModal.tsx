import React from 'react';
import { X, Save, Copy } from 'lucide-react';
import { GeneratedProblem } from '../types';
import { MathRenderer } from './MathRenderer';

interface SimilarProblemsModalProps {
    originalProblem: GeneratedProblem;
    similarProblems: GeneratedProblem[];
    onClose: () => void;
    onSaveToBank: (problems: GeneratedProblem[]) => void;
}

export const SimilarProblemsModal: React.FC<SimilarProblemsModalProps> = ({ originalProblem, similarProblems, onClose, onSaveToBank }) => {
    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Copy className="w-5 h-5" /> Bài Tập Tương Tự
                        </h2>
                        <p className="text-indigo-200 text-sm mt-1">
                            Các biến thể dựa trên kỹ thuật: <strong>{originalProblem.techniqueUsed}</strong>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-indigo-500 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                    {/* Original Problem Summary */}
                    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm opacity-75">
                         <span className="text-xs font-bold text-slate-400 uppercase mb-2 block">Bài gốc</span>
                         <div className="font-serif text-slate-600 line-clamp-3">
                             <MathRenderer content={originalProblem.content} />
                         </div>
                    </div>

                    <div className="border-t border-slate-200 my-4"></div>

                    {/* Generated Variations */}
                    {similarProblems.map((prob, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-3">
                                <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                                    Biến thể #{idx + 1}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">Độ khó: {prob.difficulty}/5</span>
                            </div>
                            <div className="font-serif text-slate-800 mb-4">
                                <MathRenderer content={prob.content} />
                            </div>
                            <details className="text-sm group">
                                <summary className="cursor-pointer text-indigo-600 font-medium list-none flex items-center gap-2">
                                    <span className="group-open:rotate-90 transition-transform">▸</span> Xem đáp án nhanh
                                </summary>
                                <div className="mt-2 pl-4 border-l-2 border-indigo-100 text-slate-600 font-serif">
                                    <MathRenderer content={prob.solution} />
                                </div>
                            </details>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Đóng
                    </button>
                    <button 
                        onClick={() => onSaveToBank(similarProblems)}
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} /> Lưu tất cả vào Ngân hàng
                    </button>
                </div>
            </div>
        </div>
    );
};
