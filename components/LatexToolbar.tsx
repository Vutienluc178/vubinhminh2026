import React, { useState } from 'react';
import { MathRenderer } from './MathRenderer';

interface LatexToolbarProps {
  onInsert: (latex: string) => void;
}

const TABS = [
  { id: 'common', label: 'Cơ bản' },
  { id: 'algebra', label: 'Đại số' },
  { id: 'geometry', label: 'Hình học/Vectơ' },
  { id: 'calculus', label: 'Giải tích' },
  { id: 'greek', label: 'Hy Lạp' },
  { id: 'logic', label: 'Logic/Tập hợp' },
];

const SYMBOLS: Record<string, { latex: string; display?: string }[]> = {
  common: [
    { latex: '+', display: '+' },
    { latex: '-', display: '-' },
    { latex: '\\times', display: '\\times' },
    { latex: '\\div', display: '\\div' },
    { latex: '=', display: '=' },
    { latex: '\\neq', display: '\\neq' },
    { latex: '\\approx', display: '\\approx' },
    { latex: '\\pm', display: '\\pm' },
    { latex: '\\frac{ }{ }', display: '\\frac{a}{b}' },
    { latex: '^{ }', display: 'x^a' },
    { latex: '_{ }', display: 'x_a' },
    { latex: '\\sqrt{ }', display: '\\sqrt{x}' },
    { latex: '\\sqrt[ ]{ }', display: '\\sqrt[n]{x}' },
    { latex: '\\left(  \\right)', display: '( )' },
    { latex: '\\left[  \\right]', display: '[ ]' },
    { latex: '\\left\\{  \\right\\}', display: '{ }' },
    { latex: '\\begin{cases}  \\\\  \\end{cases}', display: '\\begin{cases}..\\\\..\\end{cases}' },
  ],
  algebra: [
    { latex: 'x', display: 'x' },
    { latex: 'y', display: 'y' },
    { latex: 'z', display: 'z' },
    { latex: '\\infty', display: '\\infty' },
    { latex: '\\log_{ }', display: '\\log_a' },
    { latex: '\\ln', display: '\\ln' },
    { latex: '\\sin', display: '\\sin' },
    { latex: '\\cos', display: '\\cos' },
    { latex: '\\tan', display: '\\tan' },
    { latex: '\\cot', display: '\\cot' },
    { latex: '!', display: '!' },
    { latex: '| |', display: '|x|' },
  ],
  geometry: [
    { latex: '\\vec{ }', display: '\\vec{u}' },
    { latex: '\\overrightarrow{ }', display: '\\overrightarrow{AB}' },
    { latex: '\\angle', display: '\\angle' },
    { latex: '^\\circ', display: '90^\\circ' },
    { latex: '\\perp', display: '\\perp' },
    { latex: '\\parallel', display: '\\parallel' },
    { latex: '\\triangle', display: '\\triangle' },
    { latex: '\\pi', display: '\\pi' },
    { latex: '\\alpha', display: '\\alpha' },
    { latex: '\\beta', display: '\\beta' },
  ],
  calculus: [
    { latex: '\\lim_{x \\to }', display: '\\lim' },
    { latex: '\\to', display: '\\to' },
    { latex: '\\int', display: '\\int' },
    { latex: '\\int_{ }^{ }', display: '\\int_a^b' },
    { latex: '\\sum', display: '\\sum' },
    { latex: '\\prime', display: "f'" },
    { latex: 'dx', display: 'dx' },
    { latex: '\\partial', display: '\\partial' },
  ],
  greek: [
    { latex: '\\alpha', display: '\\alpha' },
    { latex: '\\beta', display: '\\beta' },
    { latex: '\\gamma', display: '\\gamma' },
    { latex: '\\delta', display: '\\delta' },
    { latex: '\\Delta', display: '\\Delta' },
    { latex: '\\epsilon', display: '\\epsilon' },
    { latex: '\\theta', display: '\\theta' },
    { latex: '\\lambda', display: '\\lambda' },
    { latex: '\\mu', display: '\\mu' },
    { latex: '\\pi', display: '\\pi' },
    { latex: '\\rho', display: '\\rho' },
    { latex: '\\sigma', display: '\\sigma' },
    { latex: '\\phi', display: '\\phi' },
    { latex: '\\omega', display: '\\omega' },
    { latex: '\\Omega', display: '\\Omega' },
  ],
  logic: [
    { latex: '\\in', display: '\\in' },
    { latex: '\\notin', display: '\\notin' },
    { latex: '\\subset', display: '\\subset' },
    { latex: '\\cup', display: '\\cup' },
    { latex: '\\cap', display: '\\cap' },
    { latex: '\\emptyset', display: '\\emptyset' },
    { latex: '\\mathbb{R}', display: '\\mathbb{R}' },
    { latex: '\\mathbb{N}', display: '\\mathbb{N}' },
    { latex: '\\mathbb{Z}', display: '\\mathbb{Z}' },
    { latex: '\\Rightarrow', display: '\\Rightarrow' },
    { latex: '\\Leftrightarrow', display: '\\Leftrightarrow' },
    { latex: '\\forall', display: '\\forall' },
    { latex: '\\exists', display: '\\exists' },
  ]
};

export const LatexToolbar: React.FC<LatexToolbarProps> = ({ onInsert }) => {
  const [activeTab, setActiveTab] = useState('common');

  return (
    <div className="bg-slate-100 border border-slate-300 rounded-xl overflow-hidden mb-4 select-none">
      {/* Tabs */}
      <div className="flex bg-slate-200 border-b border-slate-300 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="p-3 bg-white h-40 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {SYMBOLS[activeTab].map((item, idx) => (
            <button
              key={idx}
              onClick={() => onInsert(`$${item.latex}$`)}
              className="aspect-square flex items-center justify-center bg-slate-50 border border-slate-200 rounded hover:bg-indigo-50 hover:border-indigo-300 transition-all text-slate-800 shadow-sm"
              title={item.latex}
            >
              <div className="scale-75 pointer-events-none">
                 <MathRenderer content={`$${item.display || item.latex}$`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
