
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Lightbulb, GraduationCap, ZoomIn, ZoomOut, 
  CheckCircle, Moon, Sun, Palette, Timer, UserCircle, Hash, Play, Square as SquareIcon, RotateCcw,
  Dices, FileText, Maximize2, Minimize2, Settings2, Monitor, BookOpen, Volume2, VolumeX, Loader2,
  AlertCircle, Globe, GripVertical, GripHorizontal, Type, Image as ImageIcon, Upload, Edit, Save, Keyboard, Eye, PenLine, HardDriveDownload,
  PenTool, MessageSquare, Layout
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MathRenderer } from './MathRenderer';
import { GeneratedProblem } from '../types';
import { DifficultyBadge } from './DifficultyBadge';
import { WebBoard } from './WebBoard';
import { LatexToolbar } from './LatexToolbar';
import { AnnotationLayer } from './AnnotationLayer';
import { WelcomeSlide } from './WelcomeSlide';
import { SavePresentationModal } from './SavePresentationModal';
import { exportToWord } from '../services/exportService';
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

interface PresentationViewProps {
  problems: GeneratedProblem[];
  initialIndex: number;
  onClose: () => void;
  initialBackgrounds?: string[];
  onUpdateBackgrounds?: (bgs: string[]) => void;
  onUpdateProblem?: (updatedProblem: GeneratedProblem) => void;
  currentPresentationId?: string | null;
}

const MATH_COLORS = [
  { name: 'Cyan', color: '#22d3ee' },
  { name: 'Yellow', color: '#facc15' },
  { name: 'Red', color: '#f43f5e' },
  { name: 'Green', color: '#4ade80' },
  { name: 'White', color: '#ffffff' },
  { name: 'Indigo', color: '#818cf8' }
];

const ZOOM_LEVELS = [
    { label: '1x', value: 100 },
    { label: '2x', value: 200 },
    { label: '3x', value: 300 },
    { label: '4x', value: 400 },
    { label: '5x', value: 500 },
];

const PEDAGOGY_ACTIVITIES = [
  {
    id: 1,
    name: "Quay Số Trúng... Đạn",
    icon: "🎯",
    description: "Ổn định nhóm trong 10s. Giáo viên đưa câu hỏi + thời gian. Quay số ngẫu nhiên chọn 1 bạn đại diện. Đúng: Cả tổ 'lên tiên' (điểm cộng). Sai: Cả tổ 'xuống hố' (điểm trừ).",
    instruction: "1. Các nhóm có 10 giây để sẵn sàng.\n2. Quan sát câu hỏi và thảo luận trong thời gian quy định.\n3. Chờ đợi vòng quay định mệnh.\n4. Đại diện trả lời - Cả tổ cùng chịu trách nhiệm!"
  },
  {
    id: 2,
    name: "Lẩu Thập Cẩm Ý Tưởng",
    icon: "🍲",
    description: "Các nhóm 'nấu' ý tưởng trên giấy lớn. Mỗi thành viên phải đóng góp ít nhất một 'nguyên liệu' (bước giải/ý tưởng) vào nồi lẩu chung.",
    instruction: "1. Mỗi thành viên chuẩn bị 1 ý tưởng/bước giải.\n2. Lần lượt ghi vào giấy/bảng nhóm.\n3. Cả nhóm cùng 'nếm thử' (kiểm tra) và hoàn thiện bài giải.\n4. Trình bày 'món ăn' tinh thần của nhóm."
  },
  {
    id: 3,
    name: "Tiếp Sức... Hụt Hơi",
    icon: "🏃",
    description: "Mỗi thành viên chỉ được ghi ĐÚNG MỘT DÒNG rồi chuyền bút. Tuyệt đối không nói chuyện trong lúc chạy tiếp sức!",
    instruction: "1. Xếp hàng hoặc ngồi theo thứ tự.\n2. Người 1 ghi dòng đầu, chuyền bút cho người 2.\n3. Không được nhắc bài bằng lời nói.\n4. Nhóm nào hoàn thành đúng và nhanh nhất sẽ thắng."
  },
  {
    id: 4,
    name: "Chợ Đen Tri Thức",
    icon: "💰",
    description: "Một nửa nhóm ở lại 'bán' kiến thức, một nửa đi 'mua' (học) từ nhóm khác. Sau đó đổi vai để cả nhóm cùng thông thái.",
    instruction: "1. Chia nhóm thành 'Người bán' và 'Người mua'.\n2. Người bán giải thích bài cho khách từ nhóm khác.\n3. Người mua đi thu thập bí kíp từ các nhóm bạn.\n4. Quay về nhóm, chia sẻ lại những gì đã 'mua' được."
  },
  {
    id: 5,
    name: "Thám Tử Tìm... Sẹo",
    icon: "🔍",
    description: "Giáo viên đưa ra một lời giải có sẵn 3 'vết sẹo' (lỗi sai). Các nhóm đua nhau truy tìm và 'phẫu thuật' (sửa lại) cho đúng.",
    instruction: "1. Quan sát kỹ lời giải trên màn hình.\n2. Thảo luận nhóm để tìm ra 3 lỗi sai tiềm ẩn.\n3. Ghi lại lỗi sai và cách sửa đúng.\n4. Nhóm thám tử nhanh nhất sẽ nhận thưởng."
  },
  {
    id: 6,
    name: "Đấu Trường Sinh Tử",
    icon: "⚔️",
    description: "Các nhóm tự đặt ra những 'cạm bẫy' (câu hỏi hóc búa) để thách thức nhóm khác. Nhóm nào trụ lại cuối cùng là nhà vô địch.",
    instruction: "1. Mỗi nhóm soạn 1 câu hỏi 'hiểm hóc' về bài học.\n2. Thách thức nhóm đối thủ trả lời.\n3. Nếu đối thủ không giải được, nhóm bạn ghi điểm.\n4. Nếu đối thủ giải được, họ có quyền thách thức lại."
  },
  {
    id: 7,
    name: "Mảnh Ghép... Khó Đỡ",
    icon: "🧩",
    description: "Mỗi thành viên học một phần kiến thức và phải 'dạy' lại cho các bạn còn lại. Nếu một người 'gãy', cả nhóm 'toang'.",
    instruction: "1. Mỗi thành viên nhận 1 mảnh kiến thức khác nhau.\n2. Tự nghiên cứu trong 2 phút.\n3. Trở về nhóm và dạy lại cho các bạn.\n4. Kiểm tra chéo để đảm bảo ai cũng hiểu hết các mảnh ghép."
  },
  {
    id: 8,
    name: "Hội Nghị Diên Hồng... Nhí",
    icon: "📜",
    description: "Các nhóm tranh luận về một phương pháp giải gây tranh cãi. Phải thuyết phục được 'Nhà Vua' (Giáo viên) bằng lý lẽ đanh thép.",
    instruction: "1. Lắng nghe vấn đề gây tranh cãi.\n2. Thảo luận để tìm ra luận điểm bảo vệ ý kiến nhóm.\n3. Cử đại diện lên 'tâu' với Nhà Vua.\n4. Nhóm có lý lẽ thuyết phục nhất sẽ được ban thưởng."
  },
  {
    id: 9,
    name: "Cướp Cờ... Xuyên Không",
    icon: "🚩",
    description: "Câu hỏi hiện lên, nhóm nào nhanh chân chạy lên 'cướp cờ' (chạm vào bàn GV/bảng) trước sẽ giành quyền trả lời.",
    instruction: "1. Tập trung cao độ vào màn hình.\n2. Khi hiệu lệnh vang lên, đại diện chạy lên cướp cờ.\n3. Nhóm cướp được cờ có 15s để đưa ra đáp án.\n4. Trả lời sai, quyền lợi thuộc về nhóm nhanh thứ nhì."
  },
  {
    id: 10,
    name: "Gương Thần Thông Thái",
    icon: "🪞",
    description: "Một bạn nhìn màn hình giải thích, cả nhóm quay lưng lại lắng nghe và 'phản chiếu' (vẽ/ghi lại) chính xác những gì bạn nói.",
    instruction: "1. Cử 1 bạn làm 'Gương thần' nhìn màn hình.\n2. Các bạn còn lại quay lưng với màn hình.\n3. Gương thần dùng lời nói mô tả cách giải.\n4. Nhóm 'phản chiếu' lại lời giải trên giấy. So khớp với màn hình."
  }
];

// Utility for exponential backoff retry
const fetchWithRetry = async <T,>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRateLimit = err?.message?.includes('429') || err?.status === 429;
      if (isRateLimit && i < retries - 1) {
        const waitTime = delay * Math.pow(2, i);
        console.warn(`Rate limit hit. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Retry failed");
};

const splitIntoLogicalLines = (text: string): string[] => {
  if (!text) return [];
  const lines = text.split('\n');
  const result: string[] = [];
  let currentBlock: string[] = [];
  let inMathBlock = false;
  let mathBlockType = '';

  for (const line of lines) {
    currentBlock.push(line);

    if (!inMathBlock) {
      const count$$ = (line.match(/\$\$/g) || []).length;
      if (count$$ % 2 !== 0) {
        inMathBlock = true;
        mathBlockType = '$$';
      } else if (line.includes('\\[')) {
        if (!line.includes('\\]')) {
          inMathBlock = true;
          mathBlockType = '\\[';
        }
      } else if (line.includes('\\begin{')) {
        if (!line.includes('\\end{')) {
            inMathBlock = true;
            mathBlockType = '\\begin';
        }
      }
    } else {
      if (mathBlockType === '$$') {
        const count$$ = (line.match(/\$\$/g) || []).length;
        if (count$$ % 2 !== 0) {
          inMathBlock = false;
        }
      } else if (mathBlockType === '\\[') {
        if (line.includes('\\]')) {
          inMathBlock = false;
        }
      } else if (mathBlockType === '\\begin') {
        if (line.includes('\\end{')) {
          inMathBlock = false;
        }
      }
    }

    if (!inMathBlock) {
      const joined = currentBlock.join('\n');
      if (joined.trim() !== '') {
        result.push(joined);
      }
      currentBlock = [];
    }
  }

  if (currentBlock.length > 0) {
    const joined = currentBlock.join('\n');
    if (joined.trim() !== '') {
      result.push(joined);
    }
  }

  return result;
};

export const PresentationView: React.FC<PresentationViewProps> = ({ 
  problems, initialIndex, onClose, initialBackgrounds = [], onUpdateBackgrounds, onUpdateProblem, currentPresentationId
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionDisplayMode, setSolutionDisplayMode] = useState<'vertical' | 'horizontal'>(() => {
    return (localStorage.getItem('solutionDisplayMode') as 'vertical' | 'horizontal') || 'vertical';
  });
  const [showHint, setShowHint] = useState(false);
  const [isSolutionFullScreen, setIsSolutionFullScreen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [revealedLinesCount, setRevealedLinesCount] = useState(1);
  
  // Default font scale is 1.5x as requested
  const [fontSizeScale, setFontSizeScale] = useState(150);
  // Default math color set to Yellow (#facc15) for dark mode visibility
  const [mathColor, setMathColor] = useState('#facc15');
  
  // WebBoard State
  const [showWebBoard, setShowWebBoard] = useState(false);
  const [webBoardWidth, setWebBoardWidth] = useState(window.innerWidth / 2);
  const [isWebBoardCollapsed, setIsWebBoardCollapsed] = useState(false);

  // Welcome Slide State
  const [showWelcome, setShowWelcome] = useState(true);

  // Annotation Layer State
  const [showAnnotationLayer, setShowAnnotationLayer] = useState(false);
  
  // Solution Resize State
  const [solutionWidth, setSolutionWidth] = useState(window.innerWidth / 2);
  const [isDraggingSolution, setIsDraggingSolution] = useState(false);
  const [solutionHeight, setSolutionHeight] = useState(window.innerHeight * 0.5);
  const [isDraggingSolutionHeight, setIsDraggingSolutionHeight] = useState(false);
  const wasDraggingRef = useRef(false);
  
  const [solutionBgMode, setSolutionBgMode] = useState<'default' | 'glass' | 'paper' | 'accent' | 'dark' | 'vibrant' | 'minimal' | 'emerald' | 'rose' | 'amber' | 'sky' | 'violet'>(() => {
    return (localStorage.getItem('solutionBgMode') as any) || 'default';
  });
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAppFullScreen, setIsAppFullScreen] = useState(false);

  // Background Image State
  const [bgImages, setBgImages] = useState<string[]>(initialBackgrounds);
  const [selectedBgIndex, setSelectedBgIndex] = useState<number | null>(null);
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(0.8); // Default overlay opacity to ensure readability
  const [showBgMenu, setShowBgMenu] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Animation state for Core Knowledge
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);
  
  // Tools State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [randomResult, setRandomResult] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [maxStudent, setMaxStudent] = useState(45);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showLuckyMenu, setShowLuckyMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  
  // Pedagogy Menu State
  const [showPedagogyMenu, setShowPedagogyMenu] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<typeof PEDAGOGY_ACTIVITIES[0] | null>(null);
  
  // Auto-hide Control State
  const [showControls, setShowControls] = useState(true);
  const controlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{ content: string; solution: string; result: string }>({ content: '', solution: '', result: '' });
  const [activeEditField, setActiveEditField] = useState<'content' | 'solution' | 'result'>('content');
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);

  const timerRef = useRef<any>(null);
  const spinIntervalRef = useRef<any>(null);

  const currentProblem = problems[currentIndex];
  
  const coreItems = useMemo(() => {
    if (currentProblem?.techniqueUsed === 'CORE_KNOWLEDGE' || currentProblem?.techniqueUsed === 'REFLECTION') {
        try {
            return JSON.parse(currentProblem.content) as string[];
        } catch(e) { return []; }
    }
    return [];
  }, [currentProblem]);

  const logicalLines = useMemo(() => {
    if (!currentProblem?.presentation?.solutionSummary) return [];
    return splitIntoLogicalLines(currentProblem.presentation.solutionSummary);
  }, [currentProblem?.presentation?.solutionSummary]);

  useEffect(() => {
    if (!showSolution) {
      setRevealedLinesCount(1);
    }
  }, [showSolution, currentProblem?.id]);

  // Hide body scrollbar when presentation mode is active
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Sync background updates to parent
  useEffect(() => {
    if (onUpdateBackgrounds) {
      onUpdateBackgrounds(bgImages);
    }
  }, [bgImages, onUpdateBackgrounds]);

  // Handle Solution Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSolution) return;
      e.preventDefault(); // Prevent text selection/dragging issues
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= window.innerWidth - 100) {
        setSolutionWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingSolution) {
        wasDraggingRef.current = true;
        setTimeout(() => { wasDraggingRef.current = false; }, 100);
      }
      setIsDraggingSolution(false);
      document.body.style.userSelect = '';
    };

    if (isDraggingSolution) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSolution]);

  // Handle Horizontal Solution Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSolutionHeight) return;
      e.preventDefault();
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight >= 150 && newHeight <= window.innerHeight - 150) {
        setSolutionHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingSolutionHeight) {
        wasDraggingRef.current = true;
        setTimeout(() => { wasDraggingRef.current = false; }, 100);
      }
      setIsDraggingSolutionHeight(false);
      document.body.style.userSelect = '';
    };

    if (isDraggingSolutionHeight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSolutionHeight]);

  // Reset state on slide change
  useEffect(() => {
    const currentProblem = problems[currentIndex];
    if (currentProblem?.techniqueUsed === 'CORE_KNOWLEDGE' || currentProblem?.techniqueUsed === 'REFLECTION') {
      setVisibleItemsCount(1);
    } else {
      setVisibleItemsCount(0);
    }
    setShowSolution(false);
    setShowHint(false);
    setShowResult(false);
    setIsSolutionFullScreen(false);
  }, [currentIndex, problems]);

  // Auto-hide Controls Logic
  useEffect(() => {
    const handleActivity = () => {
      setShowControls(true);
      if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
      controlTimeoutRef.current = setTimeout(() => {
        // Only hide if not hovering over a menu or editing
        if (!isEditing && !showBgMenu && !showTimerMenu && !showLuckyMenu && !showZoomMenu && !showAnnotationLayer) {
            setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial timeout set
    handleActivity();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
    };
  }, [isEditing, showBgMenu, showTimerMenu, showLuckyMenu, showZoomMenu, showAnnotationLayer]);

  const handleToggleResult = () => {
    const nextShowResult = !showResult;
    setShowResult(nextShowResult);
    if (nextShowResult) {
      setTimeLeft(null);
      setIsTimerActive(false);
    }
  };

  useEffect(() => {
    if (isTimerActive && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : 0));
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive, timeLeft]);

  useEffect(() => {
    const handleFsChange = () => setIsAppFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBgImages(prev => [...prev, result]);
      setSelectedBgIndex(bgImages.length); // Auto select new image
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePrev = () => { 
      if (showSolution) {
          setShowSolution(false);
          return;
      }
      if (currentIndex > 0) setCurrentIndex(prev => prev - 1); 
  };
  
  const handleNext = (e?: React.MouseEvent | React.KeyboardEvent) => { 
    if (e) e.stopPropagation();
    if ((currentProblem?.techniqueUsed === 'CORE_KNOWLEDGE' || currentProblem?.techniqueUsed === 'REFLECTION') && visibleItemsCount < coreItems.length) {
        setVisibleItemsCount(prev => prev + 1);
        return;
    }
    if (currentIndex < problems.length - 1) setCurrentIndex(prev => prev + 1); 
  };

  const handleContentClick = (e: React.MouseEvent) => {
    if (wasDraggingRef.current) return;
    handleNext(e);
  };

  // Fireworks effect for THANK_YOU slide
  useEffect(() => {
    if (problems[currentIndex]?.techniqueUsed === 'THANK_YOU') {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [currentIndex, problems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch(e.key.toLowerCase()) {
        case 'arrowright': case ' ': 
          e.preventDefault(); 
          e.stopPropagation();
          if (showSolution && revealedLinesCount < logicalLines.length) {
            setRevealedLinesCount(prev => prev + 1);
          } else {
            handleNext(); 
          }
          break;
        case 'arrowleft': 
          e.preventDefault(); 
          if (showSolution && revealedLinesCount > 1) {
            setRevealedLinesCount(prev => prev - 1);
          } else {
            handlePrev(); 
          }
          break;
        case 'arrowdown':
          if (showSolution && revealedLinesCount < logicalLines.length) {
            e.preventDefault();
            setRevealedLinesCount(prev => prev + 1);
          }
          break;
        case 'arrowup':
          if (showSolution && revealedLinesCount > 1) {
            e.preventDefault();
            setRevealedLinesCount(prev => prev - 1);
          }
          break;
        case 's': setShowSolution(prev => !prev); break;
        case 'h': setShowHint(prev => !prev); break;
        case 'f': if (showSolution) setIsSolutionFullScreen(prev => !prev); break;
        case 'a': if (showSolution) handleToggleResult(); break;
        case 'w': setShowWebBoard(prev => !prev); break;
        case 'd': setShowAnnotationLayer(prev => !prev); break; // Toggle Draw
        case 'v': 
          const newMode = solutionDisplayMode === 'vertical' ? 'horizontal' : 'vertical';
          setSolutionDisplayMode(newMode);
          localStorage.setItem('solutionDisplayMode', newMode);
          break;
        case 'r': if (!isSpinning) generateRandom(); break;
        case 'm': toggleAppFullScreen(); break; 
        case '+': case '=': setFontSizeScale(prev => Math.min(prev + 50, 500)); break;
        case '-': case '_': setFontSizeScale(prev => Math.max(prev - 50, 100)); break;
        case '1': startTimer(1); break;
        case '2': startTimer(2); break;
        case '3': startTimer(3); break;
        case '4': startTimer(4); break;
        case '5': startTimer(5); break;
        case '0': 
          e.preventDefault();
          const coreIndex = problems.findIndex(p => p.techniqueUsed === 'CORE_KNOWLEDGE');
          if (coreIndex !== -1) setCurrentIndex(coreIndex);
          else resetTimer();
          break;
        case '9':
          e.preventDefault();
          setCurrentIndex(problems.length - 1);
          break;
        case 'escape': onClose(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, showSolution, showResult, showWebBoard, showAnnotationLayer, isSpinning, isSolutionFullScreen, maxStudent, visibleItemsCount, coreItems, solutionDisplayMode, revealedLinesCount, logicalLines]);

  useEffect(() => {
    document.documentElement.style.setProperty('--math-color', mathColor);
  }, [mathColor]);

  const toggleAppFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleExportWord = () => {
    exportToWord(problems, "Trình chiếu Olympic", 'NATIVE');
  };

  const startTimer = (mins: number) => {
    setTimeLeft(mins * 60);
    setIsTimerActive(true);
    setShowTimerMenu(false);
  };

  const resetTimer = () => {
    setTimeLeft(null);
    setIsTimerActive(false);
  };

  const generateRandom = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setShowLuckyMenu(false);
    setRandomResult(1);
    
    let count = 0;
    spinIntervalRef.current = setInterval(() => {
      setRandomResult(Math.floor(Math.random() * maxStudent) + 1);
      count += 50;
      if (count >= 3000) {
        clearInterval(spinIntervalRef.current);
        const finalNum = Math.floor(Math.random() * maxStudent) + 1;
        setRandomResult(finalNum);
        setIsSpinning(false);
        setTimeout(() => {
           if (!isSpinning) setRandomResult(null);
        }, 5000);
      }
    }, 50);
  };

  const formatMath = (text: string) => {
      if (!text) return "";
      if (text.includes('\\') && !text.includes('$')) {
          return `$${text}$`;
      }
      return text;
  };

  // Edit Handlers
  const openEditModal = () => {
    setEditData({
        content: currentProblem.presentation.questionSummary || currentProblem.content,
        solution: currentProblem.presentation.solutionSummary || currentProblem.solution,
        result: currentProblem.presentation.finalResult || ""
    });
    setIsEditing(true);
    setActiveEditField('content');
    setShowMathKeyboard(true);
  };

  const saveEdit = () => {
    if (onUpdateProblem) {
        const updatedProblem: GeneratedProblem = {
            ...currentProblem,
            presentation: {
                questionSummary: editData.content,
                solutionSummary: editData.solution,
                finalResult: editData.result
            }
        };
        onUpdateProblem(updatedProblem);
    }
    setIsEditing(false);
    setShowMathKeyboard(false);
  };

  // Helper to handle focus to track which field is active
  const handleFieldFocus = (field: 'content' | 'solution' | 'result', e: React.FocusEvent<HTMLTextAreaElement>) => {
    setActiveEditField(field);
    activeTextareaRef.current = e.target;
  };

  const handleInsertLatex = (latex: string) => {
    const el = activeTextareaRef.current;
    if (!el) return;

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const currentVal = el.value;
    
    // Insert text
    const newVal = currentVal.substring(0, start) + latex + currentVal.substring(end);
    
    // Update state based on active field
    setEditData(prev => ({
        ...prev,
        [activeEditField]: newVal
    }));

    // Restore focus and cursor (delayed to allow render)
    setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + latex.length, start + latex.length);
    }, 0);
  };

  // Determine styles based on theme AND background image presence
  const hasBgImage = selectedBgIndex !== null && bgImages[selectedBgIndex];
  
  const theme = isDarkMode ? {
    bg: hasBgImage ? 'bg-transparent' : 'bg-slate-950', 
    text: 'text-slate-100', 
    panel: 'bg-slate-900', 
    border: 'border-slate-800'
  } : {
    bg: hasBgImage ? 'bg-transparent' : 'bg-white', 
    text: 'text-slate-900', 
    panel: 'bg-slate-50', 
    border: 'border-slate-200'
  };

  const getSolutionBgClass = () => {
    switch (solutionBgMode) {
      case 'glass': return 'bg-white/10 backdrop-blur-md border-white/20';
      case 'paper': return 'bg-amber-50/90 text-slate-900 border-amber-200 shadow-lg';
      case 'accent': return 'bg-indigo-600/10 border-indigo-500 border-l-8';
      case 'dark': return 'bg-slate-900/95 border-slate-700 shadow-2xl';
      case 'vibrant': return 'bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-400/30';
      case 'minimal': return 'bg-transparent border-t border-slate-200/20';
      case 'emerald': return 'bg-emerald-600/10 border-emerald-500 border-l-8';
      case 'rose': return 'bg-rose-600/10 border-rose-500 border-l-8';
      case 'amber': return 'bg-amber-600/10 border-amber-500 border-l-8';
      case 'sky': return 'bg-sky-600/10 border-sky-500 border-l-8';
      case 'violet': return 'bg-violet-600/10 border-violet-500 border-l-8';
      default: return 'bg-indigo-500/5 border-indigo-500/20 shadow-inner';
    }
  };

  const solutionTextClass = (solutionBgMode === 'paper') ? 'text-slate-900' : (solutionBgMode === 'dark' ? 'text-slate-100' : theme.text);

  const overlayStyle = hasBgImage ? {
      backgroundColor: isDarkMode ? `rgba(2, 6, 23, ${bgOverlayOpacity})` : `rgba(255, 255, 255, ${bgOverlayOpacity})`,
      backdropFilter: 'blur(3px)'
  } : {};

  if (!currentProblem) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderContent = () => {
    if (currentProblem.techniqueUsed === 'WARM_UP') {
       const isFullUrl = currentProblem.imageUrl?.startsWith('http://') || currentProblem.imageUrl?.startsWith('https://');
       const imageSrc = isFullUrl 
           ? currentProblem.imageUrl 
           : `https://picsum.photos/seed/${currentProblem.imageUrl ? encodeURIComponent(currentProblem.imageUrl) : 'education'}/800/600`;

       return (
         <div className="flex flex-col h-full animate-fadeIn w-full relative z-10">
            <div className="h-[12.5%] flex flex-col items-center justify-center text-center px-6 border-b border-rose-500/30 bg-rose-600/10 shadow-lg relative z-10 backdrop-blur-sm">
                <div className="absolute left-6 flex items-center gap-2 opacity-50">
                    <Lightbulb size={20} className="text-rose-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Warm Up Activity</span>
                </div>
                <h1 className={`font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: `${(fontSizeScale / 100) * 2.5}rem` }}>
                    {currentProblem.title}
                </h1>
            </div>

            <div className="flex-1 overflow-hidden w-full flex flex-col justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full items-stretch">
                    {/* Left Column: Content */}
                    <div className="flex flex-col justify-center p-8 lg:p-16 space-y-8 bg-black/5 backdrop-blur-sm border-r border-rose-500/10">
                        <div className="w-full">
                            <div className={`${theme.text} font-black leading-tight text-center drop-shadow-2xl`} style={{ fontSize: `${(fontSizeScale / 100) * 2.4}rem` }}>
                                <MathRenderer content={currentProblem.content} isHighlighted={isDarkMode} />
                            </div>
                        </div>

                        {currentProblem.teacherNotes && (
                            <div className="w-full max-w-2xl mx-auto">
                                {!showSolution ? (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowSolution(true); }}
                                        className="w-full py-4 rounded-2xl border-2 border-dashed border-amber-500/50 text-amber-500/50 hover:bg-amber-500/10 hover:text-amber-500 transition-all font-bold flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Eye size={20} /> Kịch bản sư phạm
                                    </button>
                                ) : (
                                    <div className="w-full p-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 animate-fadeIn relative shadow-2xl">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setShowSolution(false); }}
                                            className="absolute top-4 right-4 p-2 text-amber-500/50 hover:text-amber-600 hover:bg-amber-500/20 rounded-full transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                        <h3 className="text-amber-500 font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-xs">
                                            <UserCircle size={20} /> Kịch bản sư phạm
                                        </h3>
                                        <div className={`${isDarkMode ? 'text-amber-100/80' : 'text-amber-900/80'} text-2xl leading-relaxed italic`}>
                                            <MathRenderer content={currentProblem.teacherNotes} isHighlighted={isDarkMode} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Image */}
                    <div className="flex items-center justify-center bg-black/20">
                        <div className="w-full h-full relative group">
                            <img 
                                src={imageSrc} 
                                alt="Minh họa hoạt động khởi động" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-transparent"></div>
                            <div className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <p className="text-white/60 text-xs font-medium flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                                    <ImageIcon size={14} /> Ảnh minh họa trực quan
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
         </div>
       );
    }

    if (currentProblem.techniqueUsed === 'CORE_KNOWLEDGE') {
       return (
         <div className="flex flex-col h-full animate-fadeIn w-full relative z-10">
            <div className="h-[12.5%] flex flex-col items-center justify-center text-center px-6 border-b border-indigo-500/30 bg-indigo-600/10 shadow-lg relative z-10 backdrop-blur-sm">
                <div className="absolute left-6 flex items-center gap-2 opacity-50">
                    <BookOpen size={20} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Core Knowledge</span>
                </div>
                <h1 className={`font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: `${(fontSizeScale / 100) * 2.5}rem` }}>
                    {currentProblem.title}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto w-full px-6 py-12 custom-scrollbar">
                <div className="w-full space-y-10">
                    {coreItems.length > 0 ? coreItems.map((item, i) => (
                        <div 
                            key={i} 
                            className={`flex gap-10 items-start transition-all duration-1000 transform border-l-[12px] border-indigo-600/10 pl-12 py-8 bg-white/2 rounded-r-[2rem] shadow-sm ${i < visibleItemsCount ? 'opacity-100 translate-x-0 border-indigo-600 bg-indigo-600/5' : 'opacity-0 translate-y-16 pointer-events-none'}`}
                        >
                            <div className="w-20 h-20 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-4xl shrink-0 shadow-2xl shadow-indigo-500/40">
                                {i + 1}
                            </div>
                            <div className={`${theme.text} font-bold leading-relaxed text-left flex-1 py-2`} style={{ fontSize: `${(fontSizeScale / 100) * 1.8}rem` }}>
                                <MathRenderer content={item} isHighlighted={isDarkMode} />
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 italic">Không có nội dung kiến thức.</p>
                    )}
                </div>
            </div>
         </div>
       );
    }

    if (currentProblem.techniqueUsed === 'REFLECTION') {
       return (
         <div className="flex flex-col h-full animate-fadeIn w-full relative z-10">
            <div className="h-[12.5%] flex flex-col items-center justify-center text-center px-6 border-b border-violet-500/30 bg-violet-600/10 shadow-lg relative z-10 backdrop-blur-sm">
                <div className="absolute left-6 flex items-center gap-2 opacity-50">
                    <MessageSquare size={20} className="text-violet-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Reflection & Consolidation</span>
                </div>
                <h1 className={`font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: `${(fontSizeScale / 100) * 2.5}rem` }}>
                    {currentProblem.title}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto w-full px-6 py-12 custom-scrollbar">
                <div className="w-full space-y-10">
                    {coreItems.length > 0 ? coreItems.map((item, i) => (
                        <div 
                            key={i} 
                            className={`flex gap-10 items-start transition-all duration-1000 transform border-l-[12px] border-violet-600/10 pl-12 py-8 bg-white/2 rounded-r-[2rem] shadow-sm ${i < visibleItemsCount ? 'opacity-100 translate-x-0 border-violet-600 bg-violet-600/5' : 'opacity-0 translate-y-16 pointer-events-none'}`}
                        >
                            <div className="w-20 h-20 bg-violet-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-4xl shrink-0 shadow-2xl shadow-violet-500/40">
                                {i + 1}
                            </div>
                            <div className={`${theme.text} font-bold leading-relaxed text-left flex-1 py-2`} style={{ fontSize: `${(fontSizeScale / 100) * 1.8}rem` }}>
                                <MathRenderer content={item} isHighlighted={isDarkMode} />
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 italic">Không có nội dung củng cố.</p>
                    )}
                </div>
            </div>
         </div>
       );
    }

    if (currentProblem.techniqueUsed === 'THANK_YOU') {
       return (
         <div className="flex flex-col h-full animate-fadeIn w-full relative z-10 items-center justify-center text-center p-20">
            <div className="space-y-12 max-w-4xl">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-500/50 animate-bounce">
                    <CheckCircle size={64} className="text-white" />
                </div>
                <h1 className={`font-black tracking-tight leading-tight drop-shadow-2xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: `${(fontSizeScale / 100) * 4}rem` }}>
                    {currentProblem.content}
                </h1>
                <div className="flex justify-center gap-4">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping delay-150"></div>
                </div>
            </div>
         </div>
       );
    }

    return (
        <div className="pro-frame shadow-2xl animate-fadeIn h-full flex flex-col relative max-w-full z-10" style={overlayStyle}>
            <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">
                        {currentProblem.techniqueUsed === 'ILLUSTRATIVE_EXAMPLE' ? 'VÍ DỤ MINH HOẠ' : 'Nội dung bài học'}
                    </span>
                </div>
                <DifficultyBadge level={currentProblem.difficulty} />
            </div>
            
            <div className="flex-grow flex flex-col overflow-hidden">
                {/* Question Area */}
                <div 
                    className={`${theme.text} leading-relaxed text-left font-bold overflow-y-auto custom-scrollbar pr-2 whitespace-pre-line transition-all duration-500`} 
                    style={{ 
                        fontSize: `${(fontSizeScale / 100) * 1.5}rem`,
                        flex: (showSolution && solutionDisplayMode === 'horizontal') ? `1 1 auto` : '1 1 auto',
                        maxHeight: (showSolution && solutionDisplayMode === 'horizontal') ? `calc(100% - ${solutionHeight}px)` : '100%'
                    }}
                >
                    <MathRenderer content={showSolution && solutionDisplayMode === 'vertical' ? currentProblem.presentation.questionSummary : currentProblem.content} isHighlighted={isDarkMode} />
                </div>
                
                {/* Horizontal Solution Panel */}
                {showSolution && solutionDisplayMode === 'horizontal' && (
                    <div 
                        className="flex flex-col overflow-hidden animate-slideUp shrink-0"
                        style={{ height: `${solutionHeight}px` }}
                    >
                        {/* Resize Handle for Horizontal Solution */}
                        <div 
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingSolutionHeight(true); }}
                            onClick={(e) => e.stopPropagation()}
                            className={`h-4 w-full cursor-row-resize z-[60] flex items-center justify-center hover:bg-indigo-500/30 transition-colors shrink-0 ${isDraggingSolutionHeight ? 'bg-indigo-500/50' : ''}`}
                            title="Kéo để thay đổi độ cao"
                        >
                            <GripHorizontal size={16} className="text-white/20" />
                        </div>
                        
                        <div className={`flex-1 flex flex-col overflow-hidden rounded-2xl p-6 border ${getSolutionBgClass()}`}>
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <GraduationCap size={20} className={solutionBgMode === 'paper' ? 'text-indigo-600' : 'text-indigo-400'} />
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${solutionBgMode === 'paper' ? 'text-indigo-600' : 'text-indigo-400'}`}>Hướng dẫn giải (Ngang)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
                                        {(['default', 'glass', 'paper', 'accent', 'dark', 'vibrant', 'minimal', 'emerald', 'rose', 'amber', 'sky', 'violet'] as const).map(mode => (
                                            <button 
                                                key={mode}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSolutionBgMode(mode);
                                                    localStorage.setItem('solutionBgMode', mode);
                                                }}
                                                className={`w-4 h-4 rounded-full border border-white/20 transition-all ${solutionBgMode === mode ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                                style={{ 
                                                    backgroundColor: 
                                                        mode === 'default' ? '#4f46e5' : 
                                                        mode === 'glass' ? 'rgba(255,255,255,0.3)' : 
                                                        mode === 'paper' ? '#fef3c7' : 
                                                        mode === 'accent' ? '#6366f1' :
                                                        mode === 'dark' ? '#0f172a' :
                                                        mode === 'vibrant' ? '#ec4899' :
                                                        mode === 'emerald' ? '#10b981' :
                                                        mode === 'rose' ? '#f43f5e' :
                                                        mode === 'amber' ? '#f59e0b' :
                                                        mode === 'sky' ? '#0ea5e9' :
                                                        mode === 'violet' ? '#8b5cf6' :
                                                        'transparent'
                                                }}
                                                title={`Chế độ nền: ${mode}`}
                                            />
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setSolutionDisplayMode('vertical');
                                            localStorage.setItem('solutionDisplayMode', 'vertical');
                                        }}
                                        className={`text-[10px] font-bold ${solutionBgMode === 'paper' ? 'text-indigo-600' : 'text-indigo-400'} hover:opacity-80 transition-colors flex items-center gap-1`}
                                    >
                                        <Layout size={12}/> CHUYỂN DỌC
                                    </button>
                                    <div className={`text-[10px] font-bold ${solutionBgMode === 'paper' ? 'text-slate-500' : 'text-slate-500'}`}>PHÍM TẮT: S</div>
                                </div>
                            </div>
                            <div 
                                className={`${solutionTextClass} leading-relaxed overflow-y-auto custom-scrollbar pr-2 ${revealedLinesCount < logicalLines.length ? 'cursor-pointer' : ''}`} 
                                style={{ fontSize: `${(fontSizeScale / 100) * 1.3}rem` }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (revealedLinesCount < logicalLines.length) {
                                        setRevealedLinesCount(prev => prev + 1);
                                    }
                                }}
                            >
                                {logicalLines.slice(0, revealedLinesCount).map((line, idx) => (
                                    <div key={idx} className="animate-slideUp mb-2">
                                        <MathRenderer content={line} isHighlighted={isDarkMode && solutionBgMode !== 'paper' && solutionBgMode !== 'minimal'} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showHint && currentProblem.hint && (
                <div className="mt-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 animate-slideUp shrink-0">
                    <h4 className="text-amber-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-sm">
                        <Lightbulb size={16} /> Gợi ý làm bài
                    </h4>
                    <div className={`${isDarkMode ? 'text-amber-100/80' : 'text-amber-900/80'} text-base leading-relaxed italic`}>
                        <MathRenderer content={currentProblem.hint} isHighlighted={isDarkMode} />
                    </div>
                </div>
            )}
            
            {!showSolution && (
                <div className="mt-2 shrink-0 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setShowSolution(true); }} className="group flex items-center gap-2 bg-indigo-600/80 text-white px-3 py-1.5 rounded-lg shadow-lg hover:bg-indigo-700 transition-all font-black text-[11px]">
                        <Lightbulb className="text-yellow-300 group-hover:rotate-12 transition-transform" size={14} /> LỜI GIẢI (S)
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            const newMode = solutionDisplayMode === 'vertical' ? 'horizontal' : 'vertical';
                            setSolutionDisplayMode(newMode);
                            localStorage.setItem('solutionDisplayMode', newMode);
                        }} 
                        className={`group flex items-center gap-2 bg-slate-700 text-white px-3 py-1.5 rounded-lg shadow-lg hover:opacity-90 transition-all font-black text-[11px]`}
                    >
                        <Layout size={14} /> 
                        {solutionDisplayMode === 'vertical' ? 'CHẾ ĐỘ NGANG (V)' : 'CHẾ ĐỘ DỌC (V)'}
                    </button>
                </div>
            )}
        </div>
    );
  };

  const effectiveWebBoardWidth = showWebBoard ? (isWebBoardCollapsed ? 24 : webBoardWidth) : 0;

  return (
    <div className={`fixed inset-0 z-[100] ${theme.bg} flex flex-col transition-all duration-500 overflow-hidden font-['Roboto'] font-bold presentation-mode`}>
      
      {showWelcome && <WelcomeSlide onStart={() => setShowWelcome(false)} />}

      {/* Background Image Layer */}
      {selectedBgIndex !== null && bgImages[selectedBgIndex] && (
          <img 
            src={bgImages[selectedBgIndex]} 
            alt="Presentation Background" 
            className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500"
          />
      )}

      {/* Overlay Layer for readability if background exists (handled in renderContent or global here) */}
      {hasBgImage && <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-300" style={{ backgroundColor: isDarkMode ? `rgba(0,0,0,${Math.max(0, bgOverlayOpacity - 0.2)})` : `rgba(255,255,255,${Math.max(0, bgOverlayOpacity - 0.2)})` }} />}

      {/* TOP BAR - AUTO HIDE */}
      <div className={`h-10 flex items-center justify-between px-4 border-b ${theme.border} backdrop-blur-md z-[110] shadow-sm relative transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white font-black px-2 py-0.5 rounded text-[8px] uppercase tracking-widest">STUDIO</div>
            <h2 className={`${theme.text} font-bold text-[11px] hidden lg:block truncate max-w-[200px]`}>{currentProblem.title}</h2>
          </div>
          
          <div className="relative flex items-center gap-0.5 bg-slate-900/50 p-0.5 rounded-md scale-90">
             <button 
                onClick={() => setShowZoomMenu(!showZoomMenu)}
                className="text-slate-400 px-2 hover:text-white flex items-center gap-1 text-[10px] font-mono"
             >
                <Type size={12}/> {fontSizeScale / 100}x <ChevronLeft size={10} className="rotate-90"/>
             </button>
             {showZoomMenu && (
                 <div className="absolute top-8 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-1 z-[130] flex flex-col gap-0.5 min-w-[60px]">
                     {ZOOM_LEVELS.map((level) => (
                         <button 
                            key={level.value}
                            onClick={() => { setFontSizeScale(level.value); setShowZoomMenu(false); }}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold text-left hover:bg-indigo-600 hover:text-white ${fontSizeScale === level.value ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}
                         >
                             {level.label}
                         </button>
                     ))}
                 </div>
             )}
          </div>
          
          <div className="flex gap-1 ml-2 scale-75">
              {MATH_COLORS.map((c) => (
                <button key={c.color} onClick={() => setMathColor(c.color)} className={`w-3.5 h-3.5 rounded-full border border-white/20 transition-all ${mathColor === c.color ? 'ring-2 ring-white scale-110 shadow-lg' : 'hover:scale-105'}`} style={{ backgroundColor: c.color }} />
              ))}
          </div>
        </div>

        {/* Pedagogy Menu - Vertical Dropdown at Top of Slide */}
        <AnimatePresence>
          {showPedagogyMenu && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="fixed top-12 left-1/2 -translate-x-1/2 z-[250] w-full max-w-md px-4"
            >
              <motion.div 
                className="bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/50 rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-amber-600/10">
                  <div className="flex items-center gap-3">
                    <GraduationCap size={20} className="text-amber-500" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">10 HOẠT ĐỘNG NHÓM</span>
                  </div>
                  <button onClick={() => setShowPedagogyMenu(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"><X size={16}/></button>
                </div>
                <div className="p-2 overflow-y-auto custom-scrollbar space-y-1">
                  {PEDAGOGY_ACTIVITIES.map((activity) => (
                    <button 
                      key={activity.id}
                      onClick={() => {
                        setSelectedActivity(activity);
                        setShowPedagogyMenu(false);
                      }}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-amber-600/10 border border-transparent hover:border-amber-500/30 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-amber-500 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        {activity.id}
                      </div>
                      <span className="text-2xl group-hover:scale-110 transition-transform">{activity.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-black text-slate-200 group-hover:text-amber-400 transition-colors uppercase tracking-tight">{activity.name}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{activity.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          
           {/* Edit Button */}
           <button 
             onClick={openEditModal}
             className={`p-1.5 rounded-lg scale-90 transition-all bg-slate-800 text-slate-400 hover:text-white`}
             title="Chỉnh sửa bài này"
           >
             <Edit size={16} />
           </button>

           {/* Save Button */}
           <button 
             onClick={() => setShowSaveModal(true)}
             className={`p-1.5 rounded-lg scale-90 transition-all bg-emerald-600 text-white hover:bg-emerald-700`}
             title="Lưu vào ngân hàng"
           >
             <HardDriveDownload size={16} />
           </button>

           {/* Annotation Button (New) */}
           <button 
             onClick={() => setShowAnnotationLayer(!showAnnotationLayer)}
             className={`p-1.5 rounded-lg scale-90 transition-all ${showAnnotationLayer ? 'bg-indigo-600 text-white shadow-glow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
             title="Bật/Tắt chế độ viết vẽ (D)"
           >
             <PenTool size={16} />
           </button>

           {/* Pedagogy Menu Button */}
           <button 
             onClick={() => { setShowPedagogyMenu(!showPedagogyMenu); setShowBgMenu(false); setShowTimerMenu(false); setShowLuckyMenu(false); }}
             className={`p-1.5 rounded-lg scale-90 transition-all ${showPedagogyMenu ? 'bg-amber-600 text-white shadow-glow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
             title="Menu Sư phạm: Hoạt động nhóm"
           >
             <GraduationCap size={16} />
           </button>

           {/* Background Menu */}
           <div className="relative">
              <button 
                onClick={() => { setShowBgMenu(!showBgMenu); setShowTimerMenu(false); setShowLuckyMenu(false); }}
                className={`p-1.5 rounded-lg scale-90 transition-all ${hasBgImage ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Chọn hình nền"
              >
                <ImageIcon size={16} />
              </button>
              {showBgMenu && (
                <div className="absolute top-10 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-[130] w-64 animate-fadeIn">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Thư viện hình nền</h3>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <button 
                            onClick={() => setSelectedBgIndex(null)}
                            className={`aspect-video rounded border-2 flex items-center justify-center text-xs text-slate-500 bg-slate-800 hover:text-white transition-all ${selectedBgIndex === null ? 'border-indigo-500' : 'border-transparent'}`}
                        >
                            None
                        </button>
                        {bgImages.map((img, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedBgIndex(idx)}
                                className={`aspect-video rounded border-2 overflow-hidden relative group ${selectedBgIndex === idx ? 'border-indigo-500' : 'border-transparent'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" alt="bg thumb" />
                            </button>
                        ))}
                         <button 
                            onClick={() => bgInputRef.current?.click()}
                            className="aspect-video rounded border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-400 transition-all"
                        >
                            <Upload size={14} />
                            <span className="text-[8px] mt-1 font-bold">Upload</span>
                        </button>
                        <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
                    </div>
                    
                    {hasBgImage && (
                        <div className="space-y-2 pt-2 border-t border-slate-700">
                             <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>Độ mờ khung nội dung</span>
                                <span>{Math.round(bgOverlayOpacity * 100)}%</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={bgOverlayOpacity} 
                                onChange={(e) => setBgOverlayOpacity(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-full appearance-none accent-indigo-500"
                             />
                        </div>
                    )}
                </div>
              )}
           </div>

          <button 
            onClick={toggleAppFullScreen}
            className={`p-1.5 rounded-lg scale-90 transition-all ${isAppFullScreen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            title="Toàn màn hình (M)"
          >
            <Monitor size={16} />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 rounded-lg border border-slate-800 scale-90">
            <div className="relative">
              <button 
                onClick={() => { setShowTimerMenu(!showTimerMenu); setShowLuckyMenu(false); setShowBgMenu(false); }} 
                className={`p-1 rounded-md transition-all ${isTimerActive ? 'text-indigo-400 animate-pulse' : 'text-slate-400 hover:text-white'}`}
                title="Đồng hồ (1-5)"
              >
                <Timer size={14} />
              </button>
              {showTimerMenu && (
                <div className="absolute top-8 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-1 z-[130] flex flex-col gap-0.5 min-w-[100px]">
                  {[1, 2, 3, 4, 5].map(m => (
                    <button key={m} onClick={() => startTimer(m)} className="px-3 py-1.5 hover:bg-indigo-600 text-white rounded text-[10px] font-bold text-left flex justify-between">
                      <span>{m}p</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 border-l border-slate-700 pl-1.5 relative">
               <button 
                onClick={() => { setShowLuckyMenu(!showLuckyMenu); setShowTimerMenu(false); setShowBgMenu(false); }} 
                disabled={isSpinning} 
                className={`p-1 transition-colors ${isSpinning ? 'text-indigo-500 animate-spin' : 'text-slate-400 hover:text-indigo-400'}`} 
                title="Vòng quay may mắn (R)"
               >
                 <Dices size={14}/>
               </button>
               {showLuckyMenu && (
                <div className="absolute top-8 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-2 z-[130] flex flex-col gap-2 min-w-[140px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sĩ số lớp</span>
                    <div className="flex gap-1">
                      <input 
                        type="number" 
                        value={maxStudent} 
                        onChange={(e) => setMaxStudent(Math.max(1, parseInt(e.target.value) || 1))}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-bold text-white w-full outline-none focus:border-indigo-500"
                        placeholder="Số HS"
                      />
                      <button 
                        onClick={generateRandom} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded transition-colors"
                      >
                        <Play size={10} />
                      </button>
                    </div>
                  </div>
                </div>
               )}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 scale-90">
             <button onClick={() => setIsDarkMode(true)} className={`p-1 rounded-md ${isDarkMode ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Moon size={12}/></button>
             <button onClick={() => setIsDarkMode(false)} className={`p-1 rounded-md ${!isDarkMode ? 'bg-white text-indigo-600' : 'text-slate-500'}`}><Sun size={12}/></button>
          </div>
          
          <button 
            onClick={() => setShowWebBoard(!showWebBoard)} 
            className={`p-1.5 rounded-lg scale-90 transition-all ${showWebBoard ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}
            title="Mở Web Studio (W)"
          >
            <Globe size={16} />
          </button>

          <button onClick={handleExportWord} className="p-1.5 bg-emerald-600 text-white rounded-lg scale-90 hover:bg-emerald-700 flex items-center gap-1 px-2" title="Xuất Word đầy đủ">
            <FileText size={14} /> <span className="text-[10px] font-bold">XUẤT WORD</span>
          </button>

          <button onClick={onClose} className="p-1.5 bg-red-500 text-white rounded-lg scale-90 hover:bg-red-600"><X size={14} /></button>
        </div>
      </div>

      {/* Selected Activity Instruction Overlay - Enhanced for Readability */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-12 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-4 border-amber-500 rounded-[40px] shadow-[0_0_100px_rgba(245,158,11,0.4)] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-zoomIn">
            <div className="bg-amber-600 p-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <span className="text-7xl drop-shadow-2xl">{selectedActivity.icon}</span>
                <div>
                  <h2 className="text-white font-black text-4xl md:text-5xl uppercase tracking-tighter leading-none mb-2">{selectedActivity.name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Hoạt động nhóm</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                    <p className="text-amber-100 text-lg font-bold opacity-90">Hướng dẫn chi tiết cho học sinh</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedActivity(null)}
                className="bg-white/10 hover:bg-white/30 p-4 rounded-3xl text-white transition-all hover:scale-110"
              >
                <X size={40} />
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
              <div className="bg-amber-500/5 border-l-8 border-amber-500 p-8 mb-10 rounded-r-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <MessageSquare size={120} />
                </div>
                <p className="text-amber-200 italic text-2xl md:text-3xl leading-relaxed font-serif relative z-10">
                  "{selectedActivity.description}"
                </p>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  <h3 className="text-white font-black text-xl uppercase tracking-widest">
                    Các bước thực hiện (Học sinh chú ý):
                  </h3>
                </div>
                
                <div className="bg-slate-800/80 rounded-[32px] p-10 border-2 border-slate-700 shadow-inner">
                  <pre className="text-slate-100 font-bold text-xl md:text-2xl whitespace-pre-wrap leading-extra-loose font-sans">
                    {selectedActivity.instruction}
                  </pre>
                </div>
              </div>
              
              <div className="mt-12 flex justify-center pb-4">
                <button 
                  onClick={() => setSelectedActivity(null)}
                  className="group bg-amber-600 hover:bg-amber-500 text-white font-black px-16 py-6 rounded-[32px] shadow-2xl shadow-amber-600/30 transition-all flex items-center gap-4 text-2xl uppercase tracking-wider hover:scale-105 active:scale-95"
                >
                  Sẵn sàng chưa? Bắt đầu nào! <Play size={32} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        className="flex-1 flex flex-col overflow-hidden relative z-10"
        style={{ marginRight: effectiveWebBoardWidth, transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Pedagogy Menu - Integrated Horizontal Ribbon at Top of Slide */}
        <AnimatePresence>
          {showPedagogyMenu && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-900/95 backdrop-blur-md border-b-2 border-amber-500/50 z-[150] shrink-0 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 flex items-center gap-2 overflow-x-auto custom-scrollbar-horizontal">
                <div className="flex items-center gap-2 px-4 border-r border-slate-700 shrink-0">
                  <GraduationCap size={18} className="text-amber-500" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest hidden md:block">HOẠT ĐỘNG NHÓM</span>
                </div>
                {PEDAGOGY_ACTIVITIES.map((activity) => (
                  <button 
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setShowPedagogyMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500/50 transition-all shrink-0 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{activity.icon}</span>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-amber-400 transition-colors whitespace-nowrap">{activity.name}</span>
                  </button>
                ))}
                <button 
                  onClick={() => setShowPedagogyMenu(false)}
                  className="ml-auto p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex overflow-hidden" onClick={handleContentClick}>
          {/* Main Content (Problem) Panel */}
          <div 
              className={`h-full overflow-y-auto custom-scrollbar p-1 md:p-2 bg-transparent relative ${isDraggingSolution ? '' : 'transition-all duration-300 ease-in-out'}`}
              style={{ 
                  width: (showSolution && solutionDisplayMode === 'vertical') && !isSolutionFullScreen ? `calc(100% - ${solutionWidth}px)` : ((showSolution && solutionDisplayMode === 'vertical') && isSolutionFullScreen ? 0 : '100%'),
                  opacity: (showSolution && solutionDisplayMode === 'vertical') && isSolutionFullScreen ? 0 : 1,
                  pointerEvents: (showSolution && solutionDisplayMode === 'vertical') && isSolutionFullScreen ? 'none' : 'auto'
              }}
          >
            {renderContent()}
          </div>

        {/* Vertical Solution Panel */}
        <div 
            className={`h-full fixed top-10 bottom-12 right-0 z-[50] ${theme.panel} ${(showSolution && solutionDisplayMode === 'vertical') ? 'translate-x-0' : 'translate-x-full'} ${isDraggingSolution ? '' : 'transition-transform duration-300 ease-in-out'}`}
            style={{ 
                width: isSolutionFullScreen ? '100%' : `${solutionWidth}px`,
                marginRight: effectiveWebBoardWidth,
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
                ...(hasBgImage ? { backgroundColor: isDarkMode ? `rgba(2, 6, 23, ${bgOverlayOpacity})` : `rgba(255, 255, 255, ${bgOverlayOpacity})`, backdropFilter: 'blur(10px)' } : {})
            }}
        >
          {showSolution && solutionDisplayMode === 'vertical' && (
            <div className="relative h-full flex flex-col">
              {/* Resize Handle for Solution Panel */}
              {!isSolutionFullScreen && (
                  <div 
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingSolution(true); }}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute left-0 top-0 bottom-0 w-4 cursor-col-resize z-[60] flex items-center justify-center hover:bg-indigo-500/30 transition-colors ${isDraggingSolution ? 'bg-indigo-500/50' : ''}`}
                    title="Kéo để thay đổi độ rộng"
                  >
                      <GripVertical size={16} className="text-white/20" />
                  </div>
              )}

              <div className={`animate-slideUp pro-frame h-full max-w-full flex flex-col p-1 md:p-2 border ${getSolutionBgClass()}`} onClick={(e) => e.stopPropagation()}>
                <div className={`flex items-center justify-between mb-2 border-b ${solutionBgMode === 'paper' ? 'border-slate-200' : 'border-white/5'} pb-1 shrink-0 pl-4`}>
                  <div className={`flex items-center gap-2 ${solutionBgMode === 'paper' ? 'text-indigo-600' : 'text-emerald-400'}`}>
                    < GraduationCap size={16}/>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Hướng dẫn giải (Dọc)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg mr-2">
                        {(['default', 'glass', 'paper', 'accent', 'dark', 'vibrant', 'minimal', 'emerald', 'rose', 'amber', 'sky', 'violet'] as const).map(mode => (
                            <button 
                                key={mode}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSolutionBgMode(mode);
                                    localStorage.setItem('solutionBgMode', mode);
                                }}
                                className={`w-3 h-3 rounded-full border border-white/20 transition-all ${solutionBgMode === mode ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                style={{ 
                                    backgroundColor: 
                                        mode === 'default' ? '#4f46e5' : 
                                        mode === 'glass' ? 'rgba(255,255,255,0.3)' : 
                                        mode === 'paper' ? '#fef3c7' : 
                                        mode === 'accent' ? '#6366f1' :
                                        mode === 'dark' ? '#0f172a' :
                                        mode === 'vibrant' ? '#ec4899' :
                                        mode === 'emerald' ? '#10b981' :
                                        mode === 'rose' ? '#f43f5e' :
                                        mode === 'amber' ? '#f59e0b' :
                                        mode === 'sky' ? '#0ea5e9' :
                                        mode === 'violet' ? '#8b5cf6' :
                                        'transparent'
                                }}
                                title={`Chế độ nền: ${mode}`}
                            />
                        ))}
                    </div>
                    <button 
                      onClick={() => {
                        setSolutionDisplayMode('horizontal');
                        localStorage.setItem('solutionDisplayMode', 'horizontal');
                      }}
                      className={`p-1 rounded hover:bg-white/10 ${solutionBgMode === 'paper' ? 'text-indigo-600' : 'text-indigo-400'} transition-colors`}
                      title="Chuyển sang chế độ ngang"
                    >
                      <Layout size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsSolutionFullScreen(!isSolutionFullScreen); }}
                      className={`p-1 rounded hover:bg-white/10 ${solutionBgMode === 'paper' ? 'text-slate-600' : 'text-slate-400'} transition-colors`}
                      title={isSolutionFullScreen ? "Thu nhỏ (F)" : "Phóng to toàn màn hình (F)"}
                    >
                      {isSolutionFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>
                </div>
                
                {/* Solution Content Area - Full View */}
                <div 
                    className={`${solutionTextClass} leading-loose text-left font-bold overflow-y-auto flex-1 custom-scrollbar pr-2 pl-2 whitespace-pre-line ${revealedLinesCount < logicalLines.length ? 'cursor-pointer' : ''}`} 
                    style={{ fontSize: `${(fontSizeScale / 100) * 1.3}rem` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (revealedLinesCount < logicalLines.length) {
                        setRevealedLinesCount(prev => prev + 1);
                      }
                    }}
                >
                   {logicalLines.slice(0, revealedLinesCount).map((line, idx) => (
                     <div key={idx} className="animate-slideUp mb-2">
                       <MathRenderer content={line} isHighlighted={isDarkMode && solutionBgMode !== 'paper' && solutionBgMode !== 'minimal'} />
                     </div>
                   ))}
                </div>

                {currentProblem.remarks && revealedLinesCount >= logicalLines.length && (
                  <div className="mt-4 pt-4 border-t border-white/10 shrink-0 pl-2 animate-slideUp">
                    <h4 className="text-purple-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-xs">
                        <MessageSquare size={14} /> Nhận xét bài
                    </h4>
                    <div className={`${theme.text} leading-relaxed text-left italic`} style={{ fontSize: `${(fontSizeScale / 100) * 1.1}rem` }}>
                        <MathRenderer content={currentProblem.remarks} isHighlighted={isDarkMode} />
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-2 border-t border-white/10 shrink-0 pl-2 pb-20">
                  <button onClick={(e) => { e.stopPropagation(); handleToggleResult(); }} className={`flex items-center gap-1 font-black uppercase text-[8px] tracking-[0.1em] mb-2 transition-colors ${showResult ? 'text-emerald-400' : 'text-slate-500 hover:text-indigo-400'}`}>
                    <CheckCircle size={12}/> {showResult ? "Kết quả" : "Hiện kết quả (A)"}
                  </button>
                  {showResult && (
                    <div className="p-2 rounded-xl border border-dashed border-emerald-500/30 animate-slideUp bg-emerald-500/5 max-w-full overflow-hidden">
                      <div className="text-emerald-400 font-bold text-center" style={{ fontSize: `${(fontSizeScale / 100) * 1.8}rem` }}>
                        <MathRenderer content={formatMath(currentProblem.presentation.finalResult)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center pointer-events-none">
           {randomResult !== null && (
             <div className={`mb-8 px-16 py-8 bg-indigo-600/90 backdrop-blur-xl border-4 border-white/30 rounded-[40px] shadow-2xl transition-all duration-300 ${isSpinning ? 'scale-105 blur-[1px]' : 'scale-125 animate-bounce'}`}>
                <div className="text-center">
                   <p className="text-white/70 text-xs font-black uppercase tracking-[0.3em] mb-2">{isSpinning ? "Đang chọn..." : "Số may mắn"}</p>
                   <p className={`text-white text-8xl font-black tabular-nums ${isSpinning ? 'opacity-50' : 'opacity-100'}`}>{randomResult}</p>
                </div>
             </div>
           )}

           {timeLeft !== null && (
             <div className={`px-12 py-4 bg-slate-900/90 backdrop-blur-md border-2 border-white/20 rounded-3xl shadow-2xl flex items-center gap-8 transition-all scale-110 ${timeLeft < 30 ? 'border-red-500/50' : ''}`}>
                <Timer size={40} className={timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-indigo-400'} />
                <div className={`text-6xl font-mono font-black tabular-nums ${timeLeft < 30 ? 'text-red-500' : 'text-white'}`}>
                   {formatTime(timeLeft)}
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 text-white p-2 rounded-lg">
                           <Edit size={20} />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-slate-800">CHỈNH SỬA NỘI DUNG</h2>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chế độ xem song song (Split View)</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowMathKeyboard(!showMathKeyboard)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${showMathKeyboard ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-400'}`}
                    >
                        <Keyboard size={16}/> Bàn phím Toán học
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-red-500"><X size={24} /></button>
                </div>
                
                {/* Split Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Input Editor */}
                    <div className="w-1/2 flex flex-col border-r border-slate-200">
                         {/* Toolbar Area */}
                         {showMathKeyboard && (
                            <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
                                <LatexToolbar onInsert={handleInsertLatex} />
                            </div>
                         )}
                         
                         <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                              <div className="space-y-3">
                                  <label className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                      <FileText size={14}/> Nội dung câu hỏi (LaTeX)
                                  </label>
                                  <textarea 
                                    className="w-full p-6 border-2 border-indigo-50 bg-indigo-50/10 rounded-2xl font-serif text-lg h-64 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                                    value={editData.content}
                                    onChange={(e) => setEditData({...editData, content: e.target.value})}
                                    onFocus={(e) => handleFieldFocus('content', e)}
                                    placeholder="Nhập nội dung đề bài..."
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                        <Lightbulb size={14}/> Hướng dẫn giải
                                    </label>
                                    <textarea 
                                      className="w-full p-6 border-2 border-emerald-50 bg-emerald-50/10 rounded-2xl font-serif text-base h-64 focus:border-emerald-500 outline-none transition-all resize-none shadow-inner"
                                      value={editData.solution}
                                      onChange={(e) => setEditData({...editData, solution: e.target.value})}
                                      onFocus={(e) => handleFieldFocus('solution', e)}
                                      placeholder="Nhập lời giải..."
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                        <PenLine size={14}/> Kết quả / Đáp số
                                    </label>
                                    <textarea 
                                      className="w-full p-6 border-2 border-rose-50 bg-rose-50/10 rounded-2xl font-serif text-lg font-bold text-emerald-600 h-64 focus:border-rose-500 outline-none transition-all resize-none shadow-inner"
                                      value={editData.result}
                                      onChange={(e) => setEditData({...editData, result: e.target.value})}
                                      onFocus={(e) => handleFieldFocus('result', e)}
                                      placeholder="Nhập kết quả cuối cùng..."
                                    />
                                </div>
                              </div>
                         </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="w-1/2 flex flex-col bg-slate-50/50">
                        <div className="p-3 bg-white border-b border-slate-100 text-center shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-center gap-2">
                                <Eye size={12}/> Xem trước thời gian thực
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                             {/* Content Preview */}
                             <div className="space-y-4">
                                 <h4 className="text-indigo-600 font-bold border-b border-indigo-100 pb-2 mb-4">NỘI DUNG</h4>
                                 <div className="font-serif text-2xl text-slate-800 leading-relaxed bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                                      <MathRenderer content={editData.content || "(Chưa có nội dung)"} />
                                 </div>
                             </div>

                             {/* Solution Preview */}
                             <div className="space-y-4">
                                 <h4 className="text-emerald-600 font-bold border-b border-emerald-100 pb-2 mb-4">HƯỚNG DẪN GIẢI</h4>
                                 <div className="font-serif text-lg text-slate-700 leading-loose italic bg-white p-8 rounded-2xl border-l-4 border-emerald-400 shadow-sm">
                                      <MathRenderer content={editData.solution || "(Chưa có lời giải)"} />
                                 </div>
                             </div>

                              {/* Result Preview */}
                             <div className="space-y-4">
                                 <h4 className="text-rose-600 font-bold border-b border-rose-100 pb-2 mb-4">KẾT QUẢ</h4>
                                 <div className="font-serif text-2xl text-emerald-600 font-bold bg-white p-8 rounded-2xl border-l-4 border-rose-400 shadow-sm">
                                      <MathRenderer content={formatMath(editData.result) || "(Chưa có kết quả)"} />
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-4 shrink-0">
                    <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Hủy bỏ</button>
                    <button onClick={saveEdit} className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95">
                        <Save size={18} /> LƯU THAY ĐỔI
                    </button>
                </div>
            </div>
        </div>
      )}

      {showWebBoard && (
        <WebBoard 
            onClose={() => setShowWebBoard(false)}
            width={webBoardWidth}
            onResize={setWebBoardWidth}
            isCollapsed={isWebBoardCollapsed}
            onToggleCollapse={setIsWebBoardCollapsed}
        />
      )}

      {/* Screen Annotation Layer (Always on top when active) */}
      {showAnnotationLayer && (
        <AnnotationLayer onClose={() => setShowAnnotationLayer(false)} />
      )}

      {showSaveModal && (
        <SavePresentationModal 
            onClose={() => setShowSaveModal(false)}
            problems={problems}
            defaultName={problems[0]?.title ? `Bài giảng - ${problems[0].title}` : undefined}
            currentPresentationId={currentPresentationId}
        />
      )}
    </div>
  );
};
