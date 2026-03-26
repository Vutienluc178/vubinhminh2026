import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { X, Eraser, Undo, Trash2, Minus, Circle, PenTool, Type, ChevronDown, ChevronUp, Grid3X3, Orbit, Square, Triangle, ChevronRight, ChevronLeft, PanelRight, PanelBottom, Image as ImageIcon } from 'lucide-react';

interface BlackboardProps {
  onClose: () => void;
  mode: 'bottom' | 'side';
  onModeChange: (mode: 'bottom' | 'side') => void;
  onCollapseChange?: (collapsed: boolean) => void; // New prop to notify parent
}

type ToolType = 'pen' | 'eraser' | 'line' | 'dashed-line' | 'circle' | 'ellipse' | 'rectangle' | 'triangle' | 'text';
type ColorType = '#ffffff' | '#facc15' | '#f43f5e' | '#4ade80' | '#60a5fa'; // Added Green, Blue

const Blackboard: React.FC<BlackboardProps> = ({ onClose, mode, onModeChange, onCollapseChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Use Refs for drawing state to avoid re-renders and closure staleness during mouse events
  const isDrawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<ColorType>('#ffffff');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isGridMode, setIsGridMode] = useState(false);
  
  // Coordinates State
  const [cursorCoords, setCursorCoords] = useState<{mathX: number, mathY: number} | null>(null);
  
  // Text tool state needs to be React state to render UI
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapseChange) {
      onCollapseChange(newState);
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, grid: boolean) => {
    // Fill Background
    ctx.fillStyle = '#1e293b'; // Slate 800
    ctx.fillRect(0, 0, width, height);

    if (grid) {
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const gridSize = 40;

      ctx.save();
      
      // Draw Grid Lines (Faint)
      ctx.strokeStyle = '#334155'; // Slate 700
      ctx.lineWidth = 1;
      ctx.beginPath();

      // Vertical lines
      for (let x = centerX; x < width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let x = centerX; x > 0; x -= gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      
      // Horizontal lines
      for (let y = centerY; y < height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      for (let y = centerY; y > 0; y -= gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      // Draw Oxy Axes (Brighter)
      ctx.strokeStyle = '#94a3b8'; // Slate 400
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // X Axis
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      // Arrow X
      ctx.lineTo(width - 10, centerY - 5);
      ctx.moveTo(width, centerY);
      ctx.lineTo(width - 10, centerY + 5);

      // Y Axis
      ctx.moveTo(centerX, height);
      ctx.lineTo(centerX, 0);
      // Arrow Y
      ctx.lineTo(centerX - 5, 10);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX + 5, 10);
      
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText('x', width - 20, centerY - 10);
      ctx.fillText('y', centerX + 10, 20);
      ctx.fillText('O', centerX - 20, centerY + 20);

      ctx.restore();
    }
  };

  // Initialize Canvas & Handle Resize
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      if (!canvas || !ctx || !container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (canvas.width === width && canvas.height === height) return;

      // Save current content if simpler resize needed (but we will redraw background)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = width;
      canvas.height = height;

      // Redraw background with current grid setting
      drawBackground(ctx, width, height, isGridMode);

      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
          ctx.drawImage(tempCanvas, 0, 0);
      }
      
      // Re-setup context defaults after resize
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    
    // Initial blank slate check
    if (ctx) {
       const data = ctx.getImageData(0,0,1,1).data;
       if (data[3] === 0) {
         drawBackground(ctx, canvas.width, canvas.height, isGridMode);
       }
    }

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isGridMode, mode, isCollapsed]); // Re-run when grid mode or layout mode changes

  // Setup context properties when tool/color changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
       ctx.strokeStyle = tool === 'eraser' ? '#1e293b' : color;
       ctx.lineWidth = tool === 'eraser' ? 30 : 3;
       ctx.lineCap = 'round';
       ctx.lineJoin = 'round';
       if (tool === 'dashed-line') {
          ctx.setLineDash([10, 10]);
       } else {
          ctx.setLineDash([]);
       }
    }
  }, [tool, color]);

  // Auto-focus input when text tool is active
  useEffect(() => {
    if (textInput && inputRef.current) {
        inputRef.current.focus();
    }
  }, [textInput]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => {
        const newHistory = [...prev, imageData];
        if (newHistory.length > 20) return newHistory.slice(-20);
        return newHistory;
      });
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const previousState = newHistory.pop(); // Get last state
    setHistory(newHistory);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && previousState) {
      ctx.putImageData(previousState, 0, 0);
    } else if (canvas && ctx && newHistory.length === 0) {
        // If history empty, reset to background
        drawBackground(ctx, canvas.width, canvas.height, isGridMode);
    }
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      saveToHistory(); // Save current state before clearing
      drawBackground(ctx, canvas.width, canvas.height, isGridMode);
      setTextInput(null);
    }
  };

  const toggleGrid = () => {
    const newMode = !isGridMode;
    setIsGridMode(newMode);
    
    // When toggling grid, we effectively clear the board and draw the grid.
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
       saveToHistory();
       drawBackground(ctx, canvas.width, canvas.height, newMode);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleTextCommit = () => {
    if (!textInput || !textInput.text.trim()) {
        setTextInput(null);
        return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        saveToHistory(); // Save before adding text
        ctx.save();
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = color;
        ctx.textBaseline = 'top'; 
        ctx.fillText(textInput.text, textInput.x, textInput.y);
        ctx.restore();
    }
    setTextInput(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                saveToHistory(); // Save state before drawing image

                // Fit width to canvas, maintain aspect ratio, place at top
                const canvasWidth = canvas.width;
                const scale = canvasWidth / img.width;
                const drawHeight = img.height * scale;
                
                // Enable high quality image scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, canvasWidth, drawHeight);
            }
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCollapsed) return;

    const { x, y } = getCoordinates(e);

    // Text Tool Logic
    if (tool === 'text') {
        if (textInput) {
            handleTextCommit();
        } else {
            setTextInput({ x, y, text: '' });
        }
        return;
    }

    if (textInput) {
        handleTextCommit();
        return;
    }

    isDrawingRef.current = true;
    startPosRef.current = { x, y };

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      // Save snapshot for shapes
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Ensure properties are set (though useEffect handles it, safe to reinforce)
      ctx.strokeStyle = tool === 'eraser' ? '#1e293b' : color;
      ctx.lineWidth = tool === 'eraser' ? 30 : 3;
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);
    
    // Calculate Grid Coordinates
    if (isGridMode && canvasRef.current) {
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const gridSize = 40;
        
        const mathX = Math.round((x - centerX) / gridSize * 10) / 10;
        const mathY = Math.round(-(y - centerY) / gridSize * 10) / 10;
        
        setCursorCoords({ mathX, mathY });
    } else {
        setCursorCoords(null);
    }

    // Drawing Logic
    if (!isDrawingRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) {
      if (tool === 'pen' || tool === 'eraser') {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        // Shape tools: Restore snapshot then draw new shape
        const snapshot = snapshotRef.current;
        const startPos = startPosRef.current;
        
        if (snapshot && startPos) {
          ctx.putImageData(snapshot, 0, 0);
          ctx.beginPath();
          ctx.setLineDash([]); // Reset line dash for shapes by default

          if (tool === 'line' || tool === 'dashed-line') {
             if (tool === 'dashed-line') ctx.setLineDash([10, 10]);
             ctx.moveTo(startPos.x, startPos.y);
             ctx.lineTo(x, y);
          } else if (tool === 'circle') {
             const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
             ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
          } else if (tool === 'ellipse') {
             const radiusX = Math.abs(x - startPos.x);
             const radiusY = Math.abs(y - startPos.y);
             ctx.ellipse(startPos.x, startPos.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
          } else if (tool === 'rectangle') {
             ctx.rect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
          } else if (tool === 'triangle') {
             ctx.moveTo(startPos.x + (x - startPos.x) / 2, startPos.y); // Top point
             ctx.lineTo(startPos.x, y); // Bottom left
             ctx.lineTo(x, y); // Bottom right
             ctx.closePath();
          }
          
          ctx.stroke();
        }
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      saveToHistory();
    }
  };

  // Determine container classes based on mode
  const getContainerStyles = () => {
    if (mode === 'side') {
      return {
        className: `fixed top-0 right-0 bottom-0 z-[100] bg-slate-900 border-l-4 border-slate-700 shadow-2xl touch-none transition-transform duration-300 ease-in-out ${
          isCollapsed ? 'translate-x-[calc(100%-40px)]' : 'translate-x-0'
        }`,
        style: { width: '50vw' }
      };
    } else {
      return {
        className: `fixed bottom-0 left-0 right-0 z-[100] bg-slate-900 border-t-4 border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] touch-none transition-transform duration-300 ease-in-out ${
          isCollapsed ? 'translate-y-[calc(100%-40px)]' : 'translate-y-0'
        }`,
        style: { height: '70vh' }
      };
    }
  };

  const containerProps = getContainerStyles();

  return (
    <div 
        ref={containerRef}
        className={containerProps.className}
        style={containerProps.style}
    >
      {/* Header / Grab Handle */}
      {mode === 'bottom' ? (
        <div 
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white flex items-center gap-2 px-4 py-1.5 rounded-t-xl shadow-sm cursor-pointer border-t border-x border-slate-600 hover:bg-slate-700 transition-colors"
          onClick={handleToggleCollapse}
          title={isCollapsed ? "Mở rộng bảng" : "Thu gọn bảng"}
        >
            <span className="text-xs font-bold uppercase tracking-wider">Bảng Đen</span>
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      ) : (
         <div 
          className="absolute top-1/2 -left-10 -translate-y-1/2 bg-slate-800 text-white flex flex-col items-center gap-2 px-1.5 py-4 rounded-l-xl shadow-sm cursor-pointer border-l border-y border-slate-600 hover:bg-slate-700 transition-colors"
          onClick={handleToggleCollapse}
          title={isCollapsed ? "Mở rộng bảng" : "Thu gọn bảng"}
        >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-wider [writing-mode:vertical-rl] rotate-180">Bảng Đen</span>
        </div>
      )}
      
      {/* Live Coordinate Display */}
      {isGridMode && cursorCoords && !isCollapsed && (
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur text-indigo-300 px-3 py-1.5 rounded-md border border-slate-700 text-sm font-mono z-[110] pointer-events-none shadow-lg">
              (x: {cursorCoords.mathX}; y: {cursorCoords.mathY})
          </div>
      )}

      {/* Hidden File Input for Image Upload */}
      <input 
        ref={imageInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleImageUpload} 
      />

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={handleMouseMove}
        onTouchEnd={stopDrawing}
        className="cursor-crosshair block w-full h-full"
      />

      {/* Text Input Overlay */}
      {textInput && !isCollapsed && (
          <input
            ref={inputRef}
            type="text"
            value={textInput.text}
            onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
            onBlur={handleTextCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTextCommit(); }}
            onMouseDown={(e) => e.stopPropagation()} 
            autoFocus
            className="absolute bg-transparent border border-dashed border-white/50 outline-none p-0 m-0 z-[110]"
            style={{
                left: textInput.x,
                top: textInput.y,
                color: color,
                font: 'bold 24px sans-serif',
                minWidth: '50px',
                textShadow: '0 1px 2px black'
            }}
            placeholder="Gõ..."
          />
      )}

      {/* Toolbar - Vertical, Right Side (or Left in Side Mode if preferred, keeping right for consistency) */}
      {!isCollapsed && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl shadow-2xl flex flex-col items-center gap-2 z-[120] max-h-[90vh] overflow-y-auto custom-scrollbar">
          
          {/* Mode Switcher */}
          <div className="flex flex-col gap-1 pb-2 border-b border-white/20">
             <button
              onClick={() => onModeChange(mode === 'bottom' ? 'side' : 'bottom')}
              className={`p-1.5 rounded-lg transition-colors text-yellow-400 hover:text-white hover:bg-white/10`}
              title={mode === 'bottom' ? "Chuyển sang chế độ chia đôi màn hình" : "Chuyển sang chế độ bảng dưới"}
            >
              {mode === 'bottom' ? <PanelRight className="w-5 h-5" /> : <PanelBottom className="w-5 h-5" />}
            </button>
          </div>

          {/* Colors */}
          <div className="flex flex-col gap-2 pb-2 border-b border-white/20">
            {['#ffffff', '#facc15', '#f43f5e', '#4ade80', '#60a5fa'].map((c) => (
                <button
                    key={c}
                    onClick={() => { setColor(c as ColorType); if (tool === 'eraser') setTool('pen'); }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && tool !== 'eraser' ? 'border-white scale-110 shadow-[0_0_10px_currentColor]' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c, color: c }}
                />
            ))}
          </div>

          {/* Tools */}
          <div className="flex flex-col gap-1 pb-2 border-b border-white/20">
            <button
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded-lg transition-colors ${tool === 'pen' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Bút viết"
            >
              <PenTool className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('text')}
              className={`p-1.5 rounded-lg transition-colors ${tool === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Nhập văn bản"
            >
              <Type className="w-4 h-4" />
            </button>

            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Chèn hình ảnh từ máy tính"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            
             <button
              onClick={() => setTool('line')}
              className={`p-1.5 rounded-lg transition-colors ${tool === 'line' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Đoạn thẳng"
            >
              <Minus className="w-4 h-4 -rotate-45" />
            </button>

            <button
              onClick={() => setTool('dashed-line')}
              className={`p-1.5 rounded-lg transition-colors ${tool === 'dashed-line' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Nét đứt"
            >
              <Minus className="w-4 h-4 -rotate-45 opacity-50 border-b-2 border-dashed border-current" />
            </button>

            <button
              onClick={() => setTool('triangle')}
              className={`p-1.5 rounded-lg transition-colors ${tool === 'triangle' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Hình Tam giác"
            >
              <Triangle className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('rectangle')}
              className={`p-1.5 rounded-lg transition-colors ${tool === 'rectangle' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Hình Chữ nhật / Vuông"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('circle')}
              className={`p-1.5 rounded-lg transition-colors ${tool === 'circle' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Hình tròn"
            >
              <Circle className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('ellipse')}
              className={`p-1.5 rounded-lg transition-colors ${tool === 'ellipse' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Hình Elip"
            >
              <Orbit className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Tẩy"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
             <button
              onClick={toggleGrid}
              className={`p-1.5 rounded-lg transition-colors ${isGridMode ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              title="Bật/Tắt hệ trục Oxy"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>

             <button
              onClick={undo}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Hoàn tác (Undo)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={clearBoard}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
              title="Xóa bảng"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-px w-full bg-white/20 my-0.5"></div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
            title="Đóng hoàn toàn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Blackboard;