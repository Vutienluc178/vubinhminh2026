
import React, { useState, useEffect, useRef } from 'react';
import { X, GripVertical, ExternalLink, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';

interface WebBoardProps {
  onClose: () => void;
  width: number;
  onResize: (newWidth: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

export const WebBoard: React.FC<WebBoardProps> = ({ onClose, width, onResize, isCollapsed, onToggleCollapse }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // Để reload iframe nếu cần

  // Ref để track việc kéo thả
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Tính toán chiều rộng mới dựa trên vị trí chuột (tính từ bên phải)
      const newWidth = window.innerWidth - e.clientX;
      
      // Giới hạn chiều rộng: Tối thiểu 300px, Tối đa toàn màn hình
      if (newWidth >= 300 && newWidth <= window.innerWidth) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Re-enable iframe pointer events and text selection
      document.body.style.userSelect = '';
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(el => el.style.pointerEvents = 'auto');
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Disable text selection and iframe interaction while dragging
      document.body.style.userSelect = 'none';
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(el => el.style.pointerEvents = 'none');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    // Nếu đang đóng mà kéo thì tự động mở ra
    if (isCollapsed) {
        onToggleCollapse(false);
    }
    setIsDragging(true);
  };

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
  };

  const HANDLE_WIDTH = 24; // Width of the collapsed bar

  return (
    <div 
      ref={sidebarRef}
      className="fixed top-0 right-0 bottom-0 z-[150] bg-white shadow-2xl flex flex-row font-sans border-l border-slate-200 transition-all duration-300 ease-in-out"
      style={{ 
          width: isCollapsed ? `${HANDLE_WIDTH}px` : `${width}px`,
          transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}
    >
      {/* Resize Handle (Thanh kéo bên trái) & Toggle Button */}
      <div 
        className={`w-[24px] h-full bg-slate-800 hover:bg-indigo-600 flex flex-col items-center justify-center shrink-0 transition-colors relative group ${isDragging ? 'bg-indigo-600' : ''}`}
      >
        {/* Drag Area */}
        <div 
            className="flex-1 w-full flex items-center justify-center cursor-col-resize"
            onMouseDown={startResize}
            title="Kéo để thay đổi kích thước"
        >
            <GripVertical className="text-white/30 w-3 h-3 group-hover:text-white/70" />
        </div>

        {/* Toggle Button */}
        <button 
            onClick={() => onToggleCollapse(!isCollapsed)}
            className="absolute top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-700 hover:bg-indigo-500 flex items-center justify-center text-white shadow-lg border-l border-white/10 z-20 rounded-l-md -left-0"
            title={isCollapsed ? "Mở rộng (Expand)" : "Thu gọn (Collapse)"}
        >
            {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Bottom decorative */}
        <div className="flex-1 w-full flex items-center justify-center cursor-col-resize" onMouseDown={startResize}>
             <div className="w-px h-10 bg-white/20"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ transition: 'opacity 0.2s' }}>
        {/* Header Control */}
        <div className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 shrink-0 shadow-md">
            <div className="flex items-center gap-3 overflow-hidden">
                <span className="bg-indigo-600 px-2 py-0.5 rounded text-[10px] text-white font-bold whitespace-nowrap">WEB STUDIO</span>
                <span className="text-yellow-400 font-black uppercase tracking-wider text-sm truncate drop-shadow-sm">
                   LỚP TOÁN THẦY VŨ TIẾN LỰC
                </span>
            </div>
            <div className="flex items-center gap-1 pl-2">
                <button 
                    onClick={handleReload}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Tải lại trang"
                >
                    <RefreshCw size={16} />
                </button>
                <a 
                    href="https://bang2026.vercel.app" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Mở tab mới"
                >
                    <ExternalLink size={16} />
                </a>
                <div className="w-px h-5 bg-slate-700 mx-2"></div>
                <button 
                    onClick={onClose}
                    className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                    title="Đóng (W)"
                >
                    <X size={18} />
                </button>
            </div>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 relative w-full h-full bg-white">
            <iframe 
                key={iframeKey}
                src="https://bang2026.vercel.app" 
                className="w-full h-full border-none"
                title="Lớp Toán Thầy Vũ Tiến Lực"
                allow="camera; microphone; fullscreen; clipboard-read; clipboard-write"
            />
        </div>
      </div>
    </div>
  );
};
