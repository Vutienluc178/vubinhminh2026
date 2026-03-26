
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { 
  PenTool, Highlighter, Eraser, Trash2, MousePointer2, X, 
  Circle, Square, Triangle, Minus, Undo2, Plus, Minus as MinusIcon
} from 'lucide-react';

interface AnnotationLayerProps {
  onClose: () => void;
}

type ToolType = 'pen' | 'highlighter' | 'eraser' | 'line' | 'circle' | 'square' | 'ellipse' | 'parallelogram' | 'triangle';

const COLORS = [
  { hex: '#ef4444', name: 'Red' },    // Red 500
  { hex: '#facc15', name: 'Yellow' }, // Yellow 400
  { hex: '#22c55e', name: 'Green' },  // Green 500
  { hex: '#3b82f6', name: 'Blue' },   // Blue 500
  { hex: '#ffffff', name: 'White' },  // White
  { hex: '#000000', name: 'Black' },  // Black
];

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDashed, setIsDashed] = useState(false);
  const [isInteractMode, setIsInteractMode] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]); // Store ImageData for fast undo
  const [showShapesMenu, setShowShapesMenu] = useState(false);

  // Setup canvas size and context
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !previewCanvas || !container) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      // Main Canvas
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Preview Canvas
      previewCanvas.width = rect.width * dpr;
      previewCanvas.height = rect.height * dpr;
      previewCanvas.style.width = `${rect.width}px`;
      previewCanvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      const pCtx = previewCanvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      if (pCtx) {
        pCtx.scale(dpr, dpr);
        pCtx.lineCap = 'round';
        pCtx.lineJoin = 'round';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => [...prev, imageData].slice(-20));
      }
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    const lastState = newHistory.pop();
    setHistory(newHistory);

    if (newHistory.length > 0) {
      ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const setupContext = (ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.setLineDash(isDashed ? [10, 10] : []);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 10;
      ctx.setLineDash([]);
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color + '26';
      ctx.lineWidth = strokeWidth * 8;
      ctx.setLineDash([]);
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, start: {x: number, y: number}, end: {x: number, y: number}) => {
    ctx.beginPath();
    const width = end.x - start.x;
    const height = end.y - start.y;

    switch (tool) {
      case 'line':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        break;
      case 'circle':
        const radius = Math.sqrt(width * width + height * height);
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        break;
      case 'square':
        const side = Math.max(Math.abs(width), Math.abs(height));
        ctx.rect(start.x, start.y, width > 0 ? side : -side, height > 0 ? side : -side);
        break;
      case 'ellipse':
        ctx.ellipse(start.x + width / 2, start.y + height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, Math.PI * 2);
        break;
      case 'parallelogram':
        ctx.moveTo(start.x + width * 0.25, start.y);
        ctx.lineTo(start.x + width, start.y);
        ctx.lineTo(start.x + width * 0.75, start.y + height);
        ctx.lineTo(start.x, start.y + height);
        ctx.closePath();
        break;
      case 'triangle':
        const h = height;
        const w = Math.abs(h) * (2 / Math.sqrt(3));
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(start.x - w / 2, start.y + h);
        ctx.lineTo(start.x + w / 2, start.y + h);
        ctx.closePath();
        break;
    }
    ctx.stroke();
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (isInteractMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    saveToHistory();

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    lastPosRef.current = { x, y };
    startPosRef.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setupContext(ctx);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || isInteractMode || !lastPosRef.current || !startPosRef.current) return;
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    const ctx = canvas.getContext('2d');
    const pCtx = previewCanvas.getContext('2d');
    if (!ctx || !pCtx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPosRef.current = { x, y };
    } else {
      // Use preview canvas for shapes
      pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      setupContext(pCtx);
      drawShape(pCtx, startPosRef.current, {x, y});
    }
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (canvas && previewCanvas && startPosRef.current && lastPosRef.current) {
      const ctx = canvas.getContext('2d');
      const pCtx = previewCanvas.getContext('2d');
      if (ctx && pCtx && !['pen', 'highlighter', 'eraser'].includes(tool)) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        setupContext(ctx);
        drawShape(ctx, startPosRef.current, {x, y});
      }
    }

    lastPosRef.current = null;
    startPosRef.current = null;
    if (canvas) canvas.releasePointerCapture(e.pointerId);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        saveToHistory();
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-[140] pointer-events-none overflow-hidden">
      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full touch-none ${isInteractMode ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'}`}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
      
      {/* Preview Canvas for Shapes */}
      <canvas
        ref={previewCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1 pointer-events-auto animate-slideUp">
        
        <button
          onClick={() => setIsInteractMode(!isInteractMode)}
          className={`p-1.5 rounded-xl transition-all ${isInteractMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Chế độ chuột (Tương tác slide)"
        >
          <MousePointer2 size={18} />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-0.5"></div>

        <button
          onClick={() => { setTool('pen'); setIsInteractMode(false); setIsDashed(false); }}
          className={`p-1.5 rounded-xl transition-all ${tool === 'pen' && !isInteractMode && !isDashed ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Bút viết"
        >
          <PenTool size={18} />
        </button>

        <button
          onClick={() => { setTool('pen'); setIsInteractMode(false); setIsDashed(true); }}
          className={`p-1.5 rounded-xl transition-all ${tool === 'pen' && isDashed ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Bút nét đứt"
        >
          <div className="relative">
            <PenTool size={18} />
            <div className="absolute -bottom-0.5 left-0 w-full h-0.5 border-b border-dashed border-current"></div>
          </div>
        </button>

        <button
          onClick={() => { setTool('highlighter'); setIsInteractMode(false); }}
          className={`p-1.5 rounded-xl transition-all ${tool === 'highlighter' && !isInteractMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Bút dạ quang"
        >
          <Highlighter size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => { setShowShapesMenu(!showShapesMenu); setIsInteractMode(false); }}
            className={`p-1.5 rounded-xl transition-all ${['circle', 'square', 'ellipse', 'parallelogram', 'triangle', 'line'].includes(tool) ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Hình vẽ"
          >
            <Circle size={18} />
          </button>
          
          {showShapesMenu && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 p-1.5 rounded-xl shadow-2xl flex gap-1 animate-fadeIn">
              <button onClick={() => { setTool('line'); setShowShapesMenu(false); }} className={`p-1.5 rounded-lg ${tool === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10'}`} title="Đoạn thẳng"><Minus size={16}/></button>
              <button onClick={() => { setTool('circle'); setShowShapesMenu(false); }} className={`p-1.5 rounded-lg ${tool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10'}`} title="Hình tròn"><Circle size={16}/></button>
              <button onClick={() => { setTool('ellipse'); setShowShapesMenu(false); }} className={`p-1.5 rounded-lg ${tool === 'ellipse' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10'}`} title="Hình elip"><div className="w-4 h-2.5 border-2 border-current rounded-[50%]"></div></button>
              <button onClick={() => { setTool('square'); setShowShapesMenu(false); }} className={`p-1.5 rounded-lg ${tool === 'square' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10'}`} title="Hình vuông"><Square size={16}/></button>
              <button onClick={() => { setTool('parallelogram'); setShowShapesMenu(false); }} className={`p-1.5 rounded-lg ${tool === 'parallelogram' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10'}`} title="Hình bình hành"><div className="w-4 h-3 border-2 border-current skew-x-[-20deg]"></div></button>
              <button onClick={() => { setTool('triangle'); setShowShapesMenu(false); }} className={`p-1.5 rounded-lg ${tool === 'triangle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10'}`} title="Tam giác đều"><Triangle size={16}/></button>
            </div>
          )}
        </div>

        <button
          onClick={() => { setTool('eraser'); setIsInteractMode(false); }}
          className={`p-1.5 rounded-xl transition-all ${tool === 'eraser' && !isInteractMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Tẩy"
        >
          <Eraser size={18} />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-0.5"></div>

        <div className="flex flex-col gap-0.5">
          <button onClick={() => setStrokeWidth(prev => Math.min(prev + 1, 10))} className="p-0.5 text-slate-400 hover:text-white"><Plus size={10}/></button>
          <div className="text-[8px] text-center font-bold text-indigo-400 leading-none">{strokeWidth}</div>
          <button onClick={() => setStrokeWidth(prev => Math.max(prev - 1, 1))} className="p-0.5 text-slate-400 hover:text-white"><MinusIcon size={10}/></button>
        </div>

        <div className="w-px h-6 bg-slate-700 mx-0.5"></div>

        <div className="flex gap-1 px-1">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => { setColor(c.hex); if(tool === 'eraser') setTool('pen'); setIsInteractMode(false); }}
              className={`w-4 h-4 rounded-full border transition-transform ${color === c.hex && tool !== 'eraser' ? 'border-white scale-125' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-slate-700 mx-0.5"></div>

        <button
          onClick={undo}
          disabled={history.length === 0}
          className={`p-1.5 rounded-xl transition-all ${history.length === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Hoàn tác (Undo)"
        >
          <Undo2 size={18} />
        </button>

        <button
          onClick={clearCanvas}
          className="p-1.5 text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors"
          title="Xóa tất cả"
        >
          <Trash2 size={18} />
        </button>

        <button
          onClick={onClose}
          className="p-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors ml-1"
          title="Đóng"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
