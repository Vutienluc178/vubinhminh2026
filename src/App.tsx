
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Brain, Upload, FileText, Settings, CheckCircle, ArrowRight, RefreshCcw, 
  Download, ChevronDown, ChevronUp, Layers, Database, Trash2, Presentation, 
  FileIcon, FileType, Image as ImageIcon, X, Lightbulb, Search, Shuffle, Check,
  FileJson, FolderInput, Share2, BookOpen, Clock, FileDown, FileUp,
  Target, GraduationCap, LayoutList, PenLine, Home, Briefcase, Edit, Save, ImagePlus, Keyboard, Eye, Plus,
  FolderOpen, Folder, ChevronRight as ChevronRightIcon, HardDrive, Archive, ArchiveRestore, Loader2, Wand2, UserCircle
} from 'lucide-react';
import { ProgressBar } from './components/ProgressBar';
import { DifficultyBadge } from './components/DifficultyBadge';
import { MathRenderer } from './components/MathRenderer';
import { PresentationView } from './components/PresentationView';
import { SimilarProblemsModal } from './components/SimilarProblemsModal';
import { IntroAnimation } from './components/IntroAnimation';
import { ApiKeyModal } from './components/ApiKeyModal';
import { LatexToolbar } from './components/LatexToolbar';
import { analyzeMathProblem, generateExamSet, generateWorksheet } from './services/geminiService';
import { exportToWord, exportWorksheetToWord, exportWorksheetForStudent } from './services/exportService';
import { 
  saveToBank, getBankItems, deleteFromBank, importToBank, 
  getFolders, getPresentations, deleteFolder, deletePresentation,
  exportFullDatabase, importFullDatabase 
} from './services/storageService';
import { AppStep, ProblemAnalysis, GeneratedProblem, ExamConfig, BankItem, InputFile, WorksheetProblem, WorksheetData, HomeworkProblem, Folder as FolderType, SavedPresentation } from './types';

const EDUCATIONAL_ICONS = ['💡', '📚', '📝', '🎯', '🔍', '⭐', '✅', '⚠️', '🧠', '➕', '➖', '✖️', '➗', '📐', '📏', '🔢', '🧪', '🌍', '⏰', '🏆'];

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [showApiModal, setShowApiModal] = useState(false);
  const [view, setView] = useState<'WORKFLOW' | 'BANK' | 'WORKSHEET'>('WORKFLOW');
  const [step, setStep] = useState<AppStep>('INPUT');
  const [loading, setLoading] = useState(false);
  
  // UI Auto-hide States
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  
  // Input States
  const [problemText, setProblemText] = useState('');
  const [inputFile, setInputFile] = useState<InputFile | null>(null);

  // Worksheet States
  const [wsTopic, setWsTopic] = useState('');
  const [wsGrade, setWsGrade] = useState('');
  const [wsTime, setWsTime] = useState<45 | 90>(45);
  const [wsLevel, setWsLevel] = useState('AVERAGE'); // BASIC | AVERAGE | GOOD | EXCELLENT | BLOOM_SYNTHESIS
  const [wsGoal, setWsGoal] = useState('SKILL'); // THEORY | SKILL | EXAM
  const [wsQuantity, setWsQuantity] = useState(5);
  const [isEditingCoreKnowledge, setIsEditingCoreKnowledge] = useState(false);
  const [isEditingWarmUp, setIsEditingWarmUp] = useState(false);
  const [isEditingIllustrativeExample, setIsEditingIllustrativeExample] = useState(false);
  const [wsHomeworkQuantity, setWsHomeworkQuantity] = useState(3);
  const [wsContext, setWsContext] = useState(''); // Textarea for custom input context
  const [wsInputFile, setWsInputFile] = useState<InputFile | null>(null); // Upload file for worksheet
  
  const [wsWarmUp, setWsWarmUp] = useState<{title: string, content: string, script: string, imageUrl?: string} | null>(null);
  const [wsCoreKnowledge, setWsCoreKnowledge] = useState<string[]>([]);
  const [wsIllustrativeExample, setWsIllustrativeExample] = useState<{formula: string, example: string, hint: string, solution: string, remarks: string} | null>(null);
  const [showIllustrativeHint, setShowIllustrativeHint] = useState(false);
  const [worksheetProblems, setWorksheetProblems] = useState<WorksheetProblem[]>([]);
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationProblems, setPresentationProblems] = useState<GeneratedProblem[]>([]);
  const [currentPresentationId, setCurrentPresentationId] = useState<string | null>(null);

  useEffect(() => {
    if (presentationMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [presentationMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'h' && !presentationMode) {
        setShowIllustrativeHint(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode]);
  const [homeworkProblems, setHomeworkProblems] = useState<HomeworkProblem[]>([]);
  const [reflectionQuestions, setReflectionQuestions] = useState<string[]>([]);

  const [analysisList, setAnalysisList] = useState<ProblemAnalysis[]>([]);
  const [selectedAnalysisIdxs, setSelectedAnalysisIdxs] = useState<Set<number>>(new Set());
  const [expandedAnalysisIdx, setExpandedAnalysisIdx] = useState<number | null>(null);
  
  const [generatedExam, setGeneratedExam] = useState<GeneratedProblem[]>([]);
  
  // BANK STATES
  const [bankTab, setBankTab] = useState<'QUESTIONS' | 'PRESENTATIONS'>('QUESTIONS');
  const [bankItems, setBankItems] = useState<BankItem[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [bankSearch, setBankSearch] = useState('');
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [filterGrade, setFilterGrade] = useState('ALL');
  
  // Folder Tree States
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [presentations, setPresentations] = useState<SavedPresentation[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Presentation Backgrounds State
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);

  // Editing State
  const [editingItem, setEditingItem] = useState<{ type: 'ANALYSIS' | 'RESULT', index: number } | null>(null);
  const [editForm, setEditForm] = useState<{ content: string, solution: string, title: string, reflectionNotes: string }>({ content: '', solution: '', title: '', reflectionNotes: '' });
  const [activeEditField, setActiveEditField] = useState<'content' | 'solution' | 'title' | 'reflectionNotes'>('content');
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const activeTextareaRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  const [config, setConfig] = useState<ExamConfig>({
    mode: 'PARALLEL',
    studentLevel: 'OLYMPIC',
    quantity: 1,
    startDifficulty: 3,
    endDifficulty: 5,
    includeSolutions: true,
    includeHints: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const fullBackupImportRef = useRef<HTMLInputElement>(null);
  const presentationFileRef = useRef<HTMLInputElement>(null);
  const wsImportRef = useRef<HTMLInputElement>(null);
  const wsFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-hide Logic based on mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientY } = e;
      const windowHeight = window.innerHeight;
      
      // Show Header if mouse is near top (e.g., < 100px)
      if (clientY < 100) {
        setIsHeaderVisible(true);
      } else {
        setIsHeaderVisible(false);
      }

      // Show Footer if mouse is near bottom (e.g., > windowHeight - 100)
      if (clientY > windowHeight - 100) {
        setIsFooterVisible(true);
      } else {
        setIsFooterVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Show Intro for 3 seconds
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (view === 'BANK') {
        setBankItems(getBankItems());
        setFolders(getFolders());
        setPresentations(getPresentations());
    }
  }, [view]);

  const uniqueTopics = useMemo(() => {
    const topics = new Set(bankItems.map(item => item.topic));
    return Array.from(topics).filter(Boolean).sort();
  }, [bankItems]);

  const uniqueGrades = useMemo(() => {
    const grades = new Set(bankItems.map(item => item.grade));
    return Array.from(grades).filter(Boolean).sort();
  }, [bankItems]);

  const filteredBankItems = useMemo(() => {
    return bankItems.filter(item => {
      const matchesSearch = item.originalContent.toLowerCase().includes(bankSearch.toLowerCase()) || 
                           item.topic.toLowerCase().includes(bankSearch.toLowerCase());
      const matchesTopic = filterTopic === 'ALL' || item.topic === filterTopic;
      const matchesGrade = filterGrade === 'ALL' || item.grade === filterGrade;
      return matchesSearch && matchesTopic && matchesGrade;
    }).sort((a, b) => b.savedAt - a.savedAt);
  }, [bankItems, bankSearch, filterTopic, filterGrade]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setInputFile({ data: base64, mimeType: file.type || 'application/octet-stream', name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleWsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setWsInputFile({ data: base64, mimeType: file.type || 'application/octet-stream', name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handlePresentationFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          if (data.length > 0 && (data[0].presentation || data[0].content)) {
            setPresentationProblems(data);
            setPresentationMode(true);
          } else {
            alert("Định dạng file không phù hợp để trình chiếu.");
          }
        }
      } catch (err) {
        alert("Lỗi khi đọc file JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const mapSelectedAnalysis = (): GeneratedProblem[] => {
    return analysisList
      .filter((_, i) => selectedAnalysisIdxs.has(i))
      .map((item, idx) => ({
        id: crypto.randomUUID(),
        title: `Bài Gốc ${idx + 1}`,
        content: item.originalContent,
        difficulty: item.difficulty,
        techniqueUsed: item.coreTechnique,
        solution: item.suggestedSolution || "N/A",
        teacherNotes: item.coreIdea,
        presentation: {
          questionSummary: item.originalContent,
          solutionSummary: item.suggestedSolution || "N/A",
          finalResult: "N/A"
        }
      }));
  };

  const handleExportBank = () => {
    const blob = new Blob([JSON.stringify(bankItems, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Olympic_Math_Bank_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportResultsJSON = (data: GeneratedProblem[], label: string) => {
    if (data.length === 0) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Olympic_Math_${label}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBank = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const count = importToBank(data);
        alert(`Đã nhập thành công ${count} mục vào ngân hàng.`);
        setBankItems(getBankItems());
      } catch (err) {
        alert("Lỗi khi nhập file JSON. Vui lòng kiểm tra định dạng.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFullBackup = () => {
      const data = exportFullDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Olympic_Math_FULL_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleFullImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              const stats = importFullDatabase(data);
              alert(`Khôi phục thành công:\n- ${stats.bankCount} câu hỏi\n- ${stats.folderCount} thư mục\n- ${stats.presCount} bài giảng`);
              // Refresh state
              setBankItems(getBankItems());
              setFolders(getFolders());
              setPresentations(getPresentations());
          } catch (err) {
              alert("Lỗi khi khôi phục dữ liệu. File không hợp lệ.");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const startAnalysis = async () => {
    if (!problemText && !inputFile) { alert("Vui lòng nhập văn bản hoặc tải lên tệp tin."); return; }
    setLoading(true);
    try {
      const result = await analyzeMathProblem(problemText, inputFile || undefined);
      setAnalysisList(result);
      setSelectedAnalysisIdxs(new Set(result.map((_, i) => i)));
      setStep('ANALYSIS');
    } catch (err) { 
        console.error(err);
        alert(err instanceof Error ? err.message : "Phân tích thất bại."); 
    } finally { setLoading(false); }
  };

  const handleCreateWorksheet = async () => {
    if (!wsTopic || !wsGrade) { alert("Vui lòng nhập đầy đủ chủ đề và lớp."); return; }
    setLoading(true);
    try {
      const data = await generateWorksheet(wsTopic, wsGrade, wsTime, wsLevel, wsGoal, wsQuantity, wsHomeworkQuantity, wsContext, wsInputFile || undefined);
      setWsWarmUp(data.warmUpActivity || null);
      setWorksheetProblems(data.problems);
      setHomeworkProblems(data.homework || []);
      setWsCoreKnowledge(data.coreKnowledge || []);
      setWsIllustrativeExample(data.illustrativeExample || null);
      setReflectionQuestions(data.reflectionQuestions);
      setStep('WORKSHEET_RESULT');
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Lỗi khi sinh phiếu học tập.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportWorksheetJSON = () => {
    const meta = { 
        topic: wsTopic, 
        grade: wsGrade, 
        time: wsTime, 
        warmUpActivity: wsWarmUp,
        coreKnowledge: wsCoreKnowledge, 
        illustrativeExample: wsIllustrativeExample,
        problems: worksheetProblems, 
        homework: homeworkProblems, 
        reflectionQuestions 
    };
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Phieu_Hoc_Tap_${wsTopic.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportWorksheetJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const wrap = JSON.parse(event.target?.result as string);
        if (wrap.problems) {
          setWsTopic(wrap.topic || "");
          setWsGrade(wrap.grade || "");
          setWsTime(wrap.time || 45);
          setWsWarmUp(wrap.warmUpActivity || null);
          setWsCoreKnowledge(wrap.coreKnowledge || []);
          setWsIllustrativeExample(wrap.illustrativeExample || null);
          setReflectionQuestions(wrap.reflectionQuestions || []);
          setWorksheetProblems(wrap.problems);
          setHomeworkProblems(wrap.homework || []);
          setWsInputFile(null); // Clear previous file if any
          setStep('WORKSHEET_RESULT');
        }
      } catch (err) {
        alert("Lỗi khi nhập file phiếu học tập.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleAnalysisSelection = (idx: number) => {
    const next = new Set(selectedAnalysisIdxs);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelectedAnalysisIdxs(next);
  };

  const startGeneration = async () => {
    const selectedProblems = analysisList.filter((_, i) => selectedAnalysisIdxs.has(i));
    if (selectedProblems.length === 0) { alert("Vui lòng chọn ít nhất một câu để tiếp tục."); return; }
    
    setLoading(true); setStep('GENERATION');
    try {
      const problems = await generateExamSet(selectedProblems, config);
      setGeneratedExam(problems);
      setStep('RESULT');
    } catch (err) { 
        console.error(err);
        alert(err instanceof Error ? err.message : "Sinh đề thất bại."); 
        setStep('CONFIG'); 
    } finally { setLoading(false); }
  };

  const handleBankAction = (action: 'PRESENT' | 'WORD' | 'JSON') => {
    const selected = bankItems.filter(item => selectedBankIds.has(item.id));
    const problems: GeneratedProblem[] = selected.map((item, idx) => ({
        id: item.id, title: `Bài ${idx + 1}`, content: item.originalContent, difficulty: item.difficulty, techniqueUsed: item.coreTechnique,
        solution: item.suggestedSolution || "N/A", teacherNotes: item.coreIdea,
        reflectionNotes: item.reflectionNotes,
        presentation: { questionSummary: item.originalContent, solutionSummary: item.suggestedSolution || "N/A", finalResult: "N/A" }
    }));

    if (action === 'PRESENT') { 
      setPresentationProblems(problems); 
      setPresentationMode(true); 
    } else if (action === 'WORD') {
      exportToWord(problems, "Ngân hàng", 'NATIVE');
    } else if (action === 'JSON') {
      const blob = new Blob([JSON.stringify(problems, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Olympic_Exam_Set_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePresentWorksheetExamples = () => {
    const problems: GeneratedProblem[] = worksheetProblems.map(w => ({
      id: w.id,
      title: w.title,
      content: w.example.content,
      difficulty: 3,
      techniqueUsed: "Ví dụ mẫu",
      solution: w.example.solution,
      teacherNotes: "Ví dụ mẫu hướng dẫn",
      presentation: {
        questionSummary: w.example.content,
        solutionSummary: w.example.solution,
        finalResult: w.example.answer
      }
    }));
    
    // Thêm slide kiến thức trọng tâm vào đầu danh sách trình chiếu
    if (wsCoreKnowledge.length > 0) {
      const coreKnowledgeProblem: GeneratedProblem = {
        id: 'core-knowledge',
        title: wsTopic || 'KIẾN THỨC TRỌNG TÂM', // Use worksheet topic for prominent title
        content: JSON.stringify(wsCoreKnowledge), // Gửi dạng JSON để PresentationView xử lý animation
        difficulty: 5,
        techniqueUsed: 'CORE_KNOWLEDGE',
        solution: '',
        teacherNotes: '',
        presentation: {
          questionSummary: wsTopic || 'Nội dung kiến thức trọng tâm cần nhớ',
          solutionSummary: '',
          finalResult: ''
        }
      };
      problems.unshift(coreKnowledgeProblem);
    }

    // Thêm slide ví dụ minh hoạ vào sau kiến thức trọng tâm
    if (wsIllustrativeExample) {
      const illustrativeExampleProblem: GeneratedProblem = {
        id: 'illustrative-example',
        title: 'VÍ DỤ MINH HOẠ',
        content: `**Công thức áp dụng:**\n${wsIllustrativeExample.formula}\n\n**Ví dụ cơ bản:**\n${wsIllustrativeExample.example}`,
        difficulty: 3,
        techniqueUsed: 'ILLUSTRATIVE_EXAMPLE',
        solution: wsIllustrativeExample.solution,
        teacherNotes: '',
        hint: wsIllustrativeExample.hint,
        remarks: wsIllustrativeExample.remarks,
        presentation: {
          questionSummary: `**Công thức áp dụng:**\n${wsIllustrativeExample.formula}\n\n**Ví dụ cơ bản:**\n${wsIllustrativeExample.example}`,
          solutionSummary: wsIllustrativeExample.solution,
          finalResult: ''
        }
      };
      
      // Chèn sau core knowledge nếu có, nếu không thì chèn đầu tiên
      const insertIndex = wsCoreKnowledge.length > 0 ? 1 : 0;
      problems.splice(insertIndex, 0, illustrativeExampleProblem);
    }

    // Thêm slide khởi động vào trước kiến thức trọng tâm
    if (wsWarmUp) {
      const warmUpProblem: GeneratedProblem = {
        id: 'warm-up',
        title: wsWarmUp.title || 'HOẠT ĐỘNG KHỞI ĐỘNG',
        content: wsWarmUp.content,
        difficulty: 1,
        techniqueUsed: 'WARM_UP',
        solution: '',
        teacherNotes: wsWarmUp.script,
        imageUrl: wsWarmUp.imageUrl,
        presentation: {
          questionSummary: wsWarmUp.content,
          solutionSummary: '',
          finalResult: ''
        }
      };
      problems.unshift(warmUpProblem);
    }

    // Thêm slide củng cố vào cuối bài
    if (reflectionQuestions.length > 0) {
      const reflectionProblem: GeneratedProblem = {
        id: 'reflection',
        title: 'CỦNG CỐ CUỐI BÀI',
        content: JSON.stringify(reflectionQuestions), // Gửi dạng JSON để PresentationView xử lý
        difficulty: 3,
        techniqueUsed: 'REFLECTION',
        solution: '',
        teacherNotes: '',
        presentation: {
          questionSummary: 'Câu hỏi củng cố cuối bài',
          solutionSummary: '',
          finalResult: ''
        }
      };
      problems.push(reflectionProblem);
    }

    // Thêm slide kết thúc bài học
    const thankYouProblem: GeneratedProblem = {
      id: 'thank-you',
      title: 'KẾT THÚC BÀI HỌC',
      content: 'Cám ơn các em đã theo dõi bài học',
      difficulty: 1,
      techniqueUsed: 'THANK_YOU',
      solution: '',
      teacherNotes: '',
      presentation: {
        questionSummary: 'Cám ơn các em đã theo dõi bài học',
        solutionSummary: '',
        finalResult: ''
      }
    };
    problems.push(thankYouProblem);

    setPresentationProblems(problems);
    setPresentationMode(true);
  };

  const handleSaveAllToBank = () => {
      const items = generatedExam.map(p => ({
          originalContent: p.content, topic: p.techniqueUsed, grade: analysisList[0]?.grade || "HSG", coreTechnique: p.techniqueUsed,
          difficulty: p.difficulty, coreIdea: p.teacherNotes, suggestedSolution: p.solution, potentialVariations: [],
          reflectionNotes: p.reflectionNotes
      }));
      saveToBank(items);
      alert("Đã lưu vào ngân hàng.");
  };

  // --- EDITING HANDLERS ---

  const startEdit = (type: 'ANALYSIS' | 'RESULT', index: number) => {
    setEditingItem({ type, index });
    setActiveEditField('content'); // Default focus
    setShowMathKeyboard(true);
    if (type === 'ANALYSIS') {
      const item = analysisList[index];
      setEditForm({ 
        title: `Bài Gốc ${index + 1}`,
        content: item.originalContent, 
        solution: item.suggestedSolution || '',
        reflectionNotes: item.reflectionNotes || ''
      });
    } else {
      const item = generatedExam[index];
      setEditForm({
        title: item.title,
        content: item.content,
        solution: item.solution,
        reflectionNotes: item.reflectionNotes || ''
      });
    }
  };

  const saveEdit = () => {
    if (!editingItem) return;

    if (editingItem.type === 'ANALYSIS') {
      const newList = [...analysisList];
      newList[editingItem.index] = {
        ...newList[editingItem.index],
        originalContent: editForm.content,
        suggestedSolution: editForm.solution,
        reflectionNotes: editForm.reflectionNotes
      };
      setAnalysisList(newList);
    } else {
      const newList = [...generatedExam];
      newList[editingItem.index] = {
        ...newList[editingItem.index],
        title: editForm.title || newList[editingItem.index].title,
        content: editForm.content,
        solution: editForm.solution,
        reflectionNotes: editForm.reflectionNotes,
        presentation: {
          ...newList[editingItem.index].presentation,
          questionSummary: editForm.content,
          solutionSummary: editForm.solution
        }
      };
      setGeneratedExam(newList);
    }
    setEditingItem(null);
    setShowMathKeyboard(false);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setShowMathKeyboard(false);
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
    setEditForm(prev => ({
        ...prev,
        [activeEditField]: newVal
    }));

    // Restore focus and cursor (delayed to allow render)
    setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + latex.length, start + latex.length);
    }, 0);
  };

  // Helper to handle focus to track which field is active
  const handleFieldFocus = (field: 'content' | 'solution' | 'title' | 'reflectionNotes', e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setActiveEditField(field);
    activeTextareaRef.current = e.target;
  };

  // Callback to update a single problem from PresentationView
  const handleUpdateProblem = (updatedProblem: GeneratedProblem) => {
    // Update in generatedExam if it exists there
    setGeneratedExam(prev => prev.map(p => p.id === updatedProblem.id ? updatedProblem : p));
    // Update in presentationProblems (which might be a subset or different set)
    setPresentationProblems(prev => prev.map(p => p.id === updatedProblem.id ? updatedProblem : p));
  };

  const handleStartNewPresentation = (problems: GeneratedProblem[]) => {
    setPresentationProblems(problems);
    setCurrentPresentationId(null);
    setPresentationMode(true);
  };

  // Tree View Handlers
  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedFolders);
    if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
    setExpandedFolders(next);
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Bạn có chắc muốn xóa thư mục này và toàn bộ bài giảng bên trong?')) {
          deleteFolder(id);
          setFolders(getFolders());
          setPresentations(getPresentations());
      }
  };

  const handlePlayPresentation = (pres: SavedPresentation) => {
      setPresentationProblems(pres.problems);
      setCurrentPresentationId(pres.id);
      setPresentationMode(true);
  };

  const handleDeletePresentation = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Xóa bài giảng này?')) {
          deletePresentation(id);
          setPresentations(getPresentations());
      }
  };

  const renderFolderTree = (parentId: string | null, level: number = 0) => {
      const children = folders.filter(f => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
      const rootFiles = presentations.filter(p => p.folderId === (parentId || 'root_unassigned')); // Hack if using null

      return (
          <div className="flex flex-col gap-1">
              {children.map(folder => {
                  const isExpanded = expandedFolders.has(folder.id);
                  const hasChildren = folders.some(f => f.parentId === folder.id) || presentations.some(p => p.folderId === folder.id);
                  
                  return (
                      <div key={folder.id}>
                          <div 
                              className="flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 group"
                              style={{ paddingLeft: `${level * 24 + 12}px` }}
                              onClick={(e) => toggleFolderExpand(folder.id, e)}
                          >
                              <button className={`p-1 rounded text-slate-400 hover:bg-slate-200 ${hasChildren ? 'visible' : 'invisible'}`}>
                                  {isExpanded ? <ChevronDown size={14}/> : <ChevronRightIcon size={14}/>}
                              </button>
                              
                              {isExpanded ? <FolderOpen size={20} className="fill-yellow-100 text-yellow-500" /> : <Folder size={20} className="fill-yellow-100 text-yellow-500" />}
                              <span className="text-sm font-bold text-slate-700 flex-1">{folder.name}</span>
                              
                              <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 transition-all">
                                  <Trash2 size={14} />
                              </button>
                          </div>
                          
                          {isExpanded && (
                              <div className="animate-slideUp">
                                  {/* Render Subfolders */}
                                  {renderFolderTree(folder.id, level + 1)}
                                  
                                  {/* Render Files in this folder */}
                                  {presentations.filter(p => p.folderId === folder.id).map(pres => (
                                      <div 
                                          key={pres.id}
                                          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-indigo-50 border border-transparent hover:border-indigo-100 group ml-2"
                                          style={{ marginLeft: `${(level + 1) * 24 + 12}px` }}
                                          onClick={() => handlePlayPresentation(pres)}
                                      >
                                          <div className="bg-indigo-600 text-white p-1.5 rounded">
                                              <Presentation size={14} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <p className="text-sm font-bold text-indigo-900 truncate">{pres.name}</p>
                                              <p className="text-[10px] text-slate-400">{new Date(pres.createdAt).toLocaleDateString()} • {pres.problems.length} slides</p>
                                          </div>
                                          <button onClick={(e) => handleDeletePresentation(pres.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 transition-all">
                                              <Trash2 size={14} />
                                          </button>
                                      </div>
                                  ))}
                                  {presentations.filter(p => p.folderId === folder.id).length === 0 && !folders.some(f => f.parentId === folder.id) && (
                                      <div className="text-[10px] text-slate-400 italic py-2" style={{ paddingLeft: `${(level + 1) * 24 + 12}px` }}>
                                          (Thư mục rỗng)
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      );
  };

  // Helper to ensure math is rendered correctly even if AI forgets delimiters
  const formatMath = (text: string) => {
      if (!text) return "";
      // If it looks like LaTeX (contains backslash) but doesn't have $, wrap it
      if (text.includes('\\') && !text.includes('$')) {
          return `$${text}$`;
      }
      return text;
  };

  // Render Intro Overlay if showIntro is true
  if (showIntro) {
    return <IntroAnimation />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-indigo-100 selection:text-indigo-900 font-['Roboto']">
      
      {/* HEADER - Auto Hiding */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <header className="bg-white/90 backdrop-blur-md shadow-sm px-8 h-18 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('WORKFLOW')}>
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl group-hover:rotate-6 transition-transform"><Brain size={24} /></div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">Soạn Giảng 4.0</h1>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">AI Professional Math Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
              <button onClick={() => { setView('WORKFLOW'); setStep('INPUT'); }} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'WORKFLOW' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Studio</button>
              <button onClick={() => { setView('WORKSHEET'); setStep('WORKSHEET_INPUT'); }} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'WORKSHEET' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Phiếu Học Tập</button>
              <button onClick={() => setView('BANK')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === 'BANK' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Ngân Hàng</button>
            </div>
            <button 
                onClick={() => setShowApiModal(true)} 
                className="p-3 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Cài đặt API Key"
            >
                <Settings size={20} />
            </button>
          </div>
        </header>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-24">
        {view === 'WORKFLOW' ? (
          <>
            {/* FOOTER PROGRESS BAR - Auto Hiding */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] transition-transform duration-300 ${isFooterVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                 <ProgressBar currentStep={step as any} />
            </div>

            <div className="mb-20">
              {step === 'INPUT' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                  <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex justify-between items-center mb-10">
                      <h2 className="text-3xl font-black text-slate-800 flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><FileText size={24}/></div>
                          Tải Lên Đề Gốc
                      </h2>
                      <button 
                        onClick={() => presentationFileRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all border border-slate-200"
                      >
                        <FileJson size={16}/> TRÌNH CHIẾU TỪ FILE JSON
                      </button>
                      <input type="file" ref={presentationFileRef} className="hidden" accept=".json" onChange={handlePresentationFileLoad} />
                    </div>
                    <div className="mb-10">
                      <textarea className="w-full h-56 p-8 bg-slate-50/50 border-2 border-slate-100 rounded-3xl font-serif text-xl focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" placeholder="Nhập đề bài tại đây..." value={problemText} onChange={(e) => setProblemText(e.target.value)} />
                    </div>
                    {!inputFile ? (
                      <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,image/*" onChange={handleFileChange} />
                        <p className="text-slate-600 font-bold text-lg mb-2">PDF, Word hoặc Ảnh chụp đề bài</p>
                      </div>
                    ) : (
                      <div className="bg-indigo-600 p-8 rounded-[2rem] flex items-center justify-between text-white shadow-2xl">
                        <div className="flex items-center gap-6">
                            <FileIcon size={28}/>
                            <p className="font-black text-lg">{inputFile.name}</p>
                        </div>
                        <button onClick={() => setInputFile(null)}><X size={20}/></button>
                      </div>
                    )}
                    <button onClick={startAnalysis} disabled={loading} className="w-full mt-12 bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl uppercase tracking-widest flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50">
                      {loading ? <RefreshCcw className="animate-spin mr-3"/> : <Brain className="mr-3" />} Bắt Đầu Phân Tích
                    </button>
                  </div>
                </div>
              )}

              {step === 'ANALYSIS' && (
                <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                  {/* ... (Previous Analysis Code - No Changes Needed Here) ... */}
                  <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
                    <h2 className="text-3xl font-black flex items-center gap-4 text-slate-800">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Layers size={24}/></div>
                      Kết Quả Phân Tích Đề Gốc
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => { handleStartNewPresentation(mapSelectedAnalysis()); }} 
                        disabled={selectedAnalysisIdxs.size === 0}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black flex items-center gap-2 text-xs shadow-lg disabled:opacity-50 hover:bg-indigo-700 transition-all"
                      >
                        <Presentation size={18}/> TRÌNH CHIẾU
                      </button>
                      <button 
                        onClick={() => exportToWord(mapSelectedAnalysis(), "De_Goc", 'NATIVE')} 
                        disabled={selectedAnalysisIdxs.size === 0}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black flex items-center gap-2 text-xs shadow-lg disabled:opacity-50 hover:bg-emerald-700 transition-all"
                      >
                        <Download size={18}/> XUẤT WORD
                      </button>
                      <button 
                        onClick={() => handleExportResultsJSON(mapSelectedAnalysis(), "De_Goc")} 
                        disabled={selectedAnalysisIdxs.size === 0}
                        className="px-6 py-3 bg-slate-800 text-white rounded-xl font-black flex items-center gap-2 text-xs shadow-lg disabled:opacity-50 hover:bg-slate-900 transition-all"
                      >
                        <FileDown size={18}/> JSON
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Hãy chọn câu bạn muốn sinh biến thể hoặc trình chiếu</p>
                        <div className="flex gap-4">
                            <button onClick={() => setSelectedAnalysisIdxs(new Set(analysisList.map((_, i) => i)))} className="text-xs font-black text-indigo-600 uppercase tracking-widest underline">Chọn tất cả</button>
                            <button onClick={() => setSelectedAnalysisIdxs(new Set())} className="text-xs font-black text-slate-400 uppercase tracking-widest underline">Bỏ chọn</button>
                        </div>
                    </div>
                    <div className="space-y-6">
                      {analysisList.map((item, idx) => {
                        return (
                          <div key={idx} 
                              onClick={() => toggleAnalysisSelection(idx)}
                              className={`p-8 border-2 rounded-3xl transition-all cursor-pointer group relative ${selectedAnalysisIdxs.has(idx) ? 'border-indigo-500 bg-indigo-50/20 shadow-lg' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}>
                            
                            <div className="absolute top-6 right-6 flex gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); startEdit('ANALYSIS', idx); }}
                                className="w-8 h-8 rounded-full border-2 bg-white border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all"
                                title="Chỉnh sửa nội dung"
                              >
                                <Edit size={14} />
                              </button>
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedAnalysisIdxs.has(idx) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}>
                                  {selectedAnalysisIdxs.has(idx) && <Check size={16} strokeWidth={4} />}
                              </div>
                            </div>

                            <div className="flex gap-3 mb-6">
                                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">{item.coreTechnique}</span>
                                <DifficultyBadge level={item.difficulty} />
                            </div>

                            <div className="font-serif text-2xl text-slate-800 leading-relaxed pr-10">
                                <MathRenderer content={item.originalContent} />
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setExpandedAnalysisIdx(expandedAnalysisIdx === idx ? null : idx); }} className="mt-8 text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                              {expandedAnalysisIdx === idx ? "Thu gọn" : "Xem hướng giải mấu chốt"} <ArrowRight size={14}/>
                            </button>
                            {expandedAnalysisIdx === idx && (
                              <div className="mt-6 p-8 bg-white border border-indigo-50 rounded-2xl animate-slideUp italic text-slate-600">
                                  <MathRenderer content={item.suggestedSolution || ""} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end gap-6">
                    <button onClick={() => setStep('INPUT')} className="px-10 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-slate-500 hover:bg-slate-50 transition-colors">QUAY LẠI</button>
                    <button onClick={() => setStep('CONFIG')} disabled={selectedAnalysisIdxs.size === 0} className="px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl disabled:opacity-50 uppercase tracking-widest hover:bg-indigo-700 transition-all">
                      Tiếp Tục Sinh Biến Thể ({selectedAnalysisIdxs.size}) <ArrowRight size={20}/>
                    </button>
                  </div>
                </div>
              )}

              {step === 'CONFIG' && (
                <div className="max-w-3xl mx-auto bg-white p-16 rounded-[2.5rem] border shadow-2xl">
                  <h2 className="text-3xl font-black mb-12 text-slate-800">Thiết Lập Sinh Đề</h2>
                  <div className="space-y-12">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Trình độ mục tiêu</label>
                      <select value={config.studentLevel} onChange={(e) => setConfig({...config, studentLevel: e.target.value as any})} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none">
                        <option value="OLYMPIC">Chuyên Toán / Olympic</option>
                        <option value="EXCELLENT">Giỏi (Vận dụng cao)</option>
                        <option value="GOOD">Khá</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex justify-between font-black text-slate-700 mb-6 uppercase text-xs tracking-widest">Biến thể mỗi câu: <span className="text-indigo-600 text-lg">{config.quantity}</span></label>
                      <input type="range" min="1" max="5" value={config.quantity} onChange={(e) => setConfig({...config, quantity: parseInt(e.target.value)})} className="w-full h-3 bg-slate-100 rounded-full appearance-none accent-indigo-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <button onClick={() => setConfig({...config, mode: 'PARALLEL'})} className={`p-8 border-2 rounded-[2rem] font-black transition-all ${config.mode === 'PARALLEL' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg' : 'border-slate-100 text-slate-400'}`}>
                         <Database className="mx-auto mb-3" size={24}/> SONG SONG
                         <p className="text-[9px] font-normal opacity-70 mt-1">Giữ cấu trúc - Thay số</p>
                      </button>
                      <button onClick={() => setConfig({...config, mode: 'CREATIVE'})} className={`p-8 border-2 rounded-[2rem] font-black transition-all ${config.mode === 'CREATIVE' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg' : 'border-slate-100 text-slate-400'}`}>
                         <Shuffle className="mx-auto mb-3" size={24}/> SÁNG TẠO
                         <p className="text-[9px] font-normal opacity-70 mt-1">Phát triển - Biến thể</p>
                      </button>
                    </div>
                    <button onClick={startGeneration} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black shadow-2xl hover:bg-indigo-700 transition-all text-2xl uppercase tracking-widest">BẮT ĐẦU XỬ LÝ AI</button>
                  </div>
                </div>
              )}

              {step === 'RESULT' && (
                <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn">
                  <div className="flex justify-between items-end bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl">
                    <div>
                      <h2 className="text-4xl font-black text-slate-800">Kết Quả Đề Thi</h2>
                      <p className="text-slate-400 text-sm mt-1">Đã sinh thành công {generatedExam.length} biến thể chất lượng cao</p>
                    </div>
                      <div className="flex gap-4">
                        <button onClick={() => { handleStartNewPresentation(generatedExam); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center shadow-xl hover:bg-indigo-700 transition-all"><Presentation className="mr-3" size={20}/> TRÌNH CHIẾU</button>
                        <button onClick={() => exportToWord(generatedExam, "Olympic_Result", 'NATIVE')} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center shadow-xl hover:bg-emerald-700 transition-all"><Download className="mr-3" size={20}/> XUẤT WORD</button>
                        <button onClick={() => handleExportResultsJSON(generatedExam, "Result")} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black flex items-center shadow-xl hover:bg-slate-900 transition-all"><FileDown className="mr-3" size={20}/> XUẤT JSON</button>
                      </div>
                  </div>
                  <div className="grid gap-8">
                    {generatedExam.map((p, i) => {
                      return (
                        <div key={i} className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative">
                          <button 
                            onClick={() => startEdit('RESULT', i)}
                            className="absolute top-12 right-12 w-10 h-10 rounded-full border-2 bg-white border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all"
                            title="Chỉnh sửa bài toán"
                          >
                            <Edit size={16} />
                          </button>

                          <div className="flex justify-between mb-8">
                              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-5 py-2 rounded-full">{p.title}</span>
                              <DifficultyBadge level={p.difficulty} />
                          </div>
                          <div className="font-serif text-3xl leading-relaxed mb-12 text-slate-800"><MathRenderer content={p.content} isHighlighted /></div>
                          <details className="group border-t-2 pt-10 border-slate-50">
                              <summary className="cursor-pointer font-black text-slate-400 uppercase text-[10px] tracking-widest list-none flex items-center justify-between">
                                  <span>▸ HƯỚNG DẪN GIẢI CHI TIẾT</span>
                                  <ChevronDown className="group-open:rotate-180 transition-transform" size={18}/>
                              </summary>
                              <div className="mt-8 p-12 bg-slate-50 rounded-[2rem] italic text-slate-700 leading-loose text-xl border-l-8 border-indigo-500">
                                  <MathRenderer content={p.solution} />
                              </div>
                          </details>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4">
                      <button onClick={handleSaveAllToBank} className="flex-1 py-6 bg-slate-900 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-black transition-all">
                          <Database size={24}/> LƯU TẤT CẢ VÀO NGÂN HÀNG
                      </button>
                      <button onClick={() => setStep('INPUT')} className="px-10 py-6 bg-white border-2 border-slate-200 rounded-3xl text-slate-400 hover:text-indigo-600 transition-colors">
                          <RefreshCcw size={28} />
                      </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : view === 'WORKSHEET' ? (
          <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
            {/* ... (Previous Worksheet Code - No Changes Needed Here) ... */}
            {step === 'WORKSHEET_INPUT' && (
               <div className="max-w-4xl mx-auto bg-white p-16 rounded-[2.5rem] border shadow-2xl">
                 <div className="flex items-center gap-6 mb-12">
                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center"><BookOpen size={32}/></div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-800">Tạo Phiếu Học Tập</h2>
                      <p className="text-slate-400 text-sm font-medium">Thiết kế bài giảng chuẩn sư phạm từ chuyên gia</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex justify-end">
                            <button onClick={() => wsImportRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all">
                                <FileUp size={16}/> NHẬP FILE CŨ (JSON)
                            </button>
                            <input type="file" ref={wsImportRef} className="hidden" accept=".json" onChange={handleImportWorksheetJSON} />
                        </div>
                     </div>

                     <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chủ đề học tập</label>
                         <input 
                           type="text" 
                           className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                           placeholder="Ví dụ: Hệ thức lượng trong tam giác..." 
                           value={wsTopic}
                           onChange={(e) => setWsTopic(e.target.value)}
                         />
                     </div>

                     <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp / Cấp độ</label>
                         <input 
                           type="text" 
                           className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all"
                           placeholder="Ví dụ: Lớp 10A1..." 
                           value={wsGrade}
                           onChange={(e) => setWsGrade(e.target.value)}
                         />
                     </div>
                 </div>
                 
                 <div className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100 mb-8 space-y-6">
                    <h3 className="text-sm font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2"><Settings size={16}/> Cấu hình sư phạm</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><GraduationCap size={12}/> Trình độ học sinh</label>
                             <select value={wsLevel} onChange={(e) => setWsLevel(e.target.value)} className="w-full p-3 bg-white border border-indigo-100 rounded-xl font-bold text-sm outline-none text-slate-700">
                                 <option value="BASIC">Yếu / Trung bình</option>
                                 <option value="AVERAGE">Khá</option>
                                 <option value="GOOD">Giỏi</option>
                                 <option value="EXCELLENT">Xuất sắc / Chuyên</option>
                                 <option value="BLOOM_SYNTHESIS">Bloom: Tổng hợp & Sáng tạo</option>
                             </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Target size={12}/> Mục tiêu</label>
                             <select value={wsGoal} onChange={(e) => setWsGoal(e.target.value)} className="w-full p-3 bg-white border border-indigo-100 rounded-xl font-bold text-sm outline-none text-slate-700">
                                 <option value="SKILL">Rèn kỹ năng tính toán</option>
                                 <option value="THEORY">Hiểu sâu lý thuyết</option>
                                 <option value="EXAM">Luyện thi / Tổng ôn</option>
                             </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Thời lượng</label>
                             <div className="flex gap-2">
                                <button onClick={() => setWsTime(45)} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${wsTime === 45 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-indigo-100'}`}>45p</button>
                                <button onClick={() => setWsTime(90)} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${wsTime === 90 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-indigo-100'}`}>90p</button>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><LayoutList size={12}/> Số lượng câu hỏi / dạng bài</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="50" 
                                    value={wsQuantity} 
                                    onChange={(e) => setWsQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 py-1 px-2 text-right bg-white border-2 border-indigo-100 rounded-lg font-black text-indigo-600 outline-none focus:border-indigo-500 transition-all text-sm"
                                />
                             </div>
                             <input 
                                type="range" 
                                min="1" 
                                max="30" 
                                value={wsQuantity} 
                                onChange={(e) => setWsQuantity(parseInt(e.target.value))} 
                                className="w-full h-2 bg-indigo-200 rounded-full appearance-none accent-indigo-600 cursor-pointer" 
                             />
                         </div>

                         <div className="space-y-2">
                             <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1"><Home size={12}/> Số lượng BTVN</label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    max="20" 
                                    value={wsHomeworkQuantity} 
                                    onChange={(e) => setWsHomeworkQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-16 py-1 px-2 text-right bg-white border-2 border-violet-100 rounded-lg font-black text-violet-600 outline-none focus:border-violet-500 transition-all text-sm"
                                />
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                value={wsHomeworkQuantity} 
                                onChange={(e) => setWsHomeworkQuantity(parseInt(e.target.value))} 
                                className="w-full h-2 bg-violet-200 rounded-full appearance-none accent-violet-600 cursor-pointer" 
                             />
                         </div>
                    </div>
                 </div>

                 <div className="space-y-4 mb-10">
                    <h3 className="text-sm font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">
                        <Database size={16}/> Dữ liệu đầu vào (Tùy chọn)
                    </h3>
                    
                    {/* File Upload Area */}
                    {!wsInputFile ? (
                        <div onClick={() => wsFileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all">
                            <input type="file" ref={wsFileInputRef} className="hidden" accept=".pdf,.docx,image/*" onChange={handleWsFileChange} />
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                <Upload size={24} />
                                <p className="font-bold text-sm">Tải lên tài liệu (PDF, Word, Ảnh đề bài...)</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-indigo-50 p-4 rounded-2xl flex items-center justify-between text-indigo-900 border border-indigo-100">
                            <div className="flex items-center gap-4">
                                <FileIcon size={24} className="text-indigo-600"/>
                                <div>
                                    <p className="font-black text-sm">{wsInputFile.name}</p>
                                    <p className="text-xs opacity-70">Đã tải lên</p>
                                </div>
                            </div>
                            <button onClick={() => setWsInputFile(null)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={16}/></button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <PenLine size={12}/> Hoặc nhập nội dung / yêu cầu cụ thể
                        </label>
                        <textarea 
                            className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-serif text-sm focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-slate-300"
                            placeholder="Paste đề bài mẫu, định lý cần nhấn mạnh, hoặc yêu cầu đặc biệt tại đây để AI bám sát..."
                            value={wsContext}
                            onChange={(e) => setWsContext(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleCreateWorksheet}
                    disabled={loading || (!wsContext.trim() && !wsInputFile)}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <><Loader2 className="animate-spin" size={24}/> Đang soạn phiếu...</>
                    ) : (
                        <><Wand2 size={24}/> TẠO PHIẾU HỌC TẬP</>
                    )}
                </button>
            </div>
        )}

        {step === 'WORKSHEET_RESULT' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="bg-white p-8 rounded-[2rem] border shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
                   <div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Phiếu Học Tập: {wsTopic}</h2>
                      <p className="text-indigo-600 font-bold">Thời gian: {wsTime} phút | Đối tượng: {wsGrade}</p>
                   </div>
                   <div className="flex flex-wrap gap-2 justify-center">
                      <button onClick={handlePresentWorksheetExamples} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black flex items-center gap-2 text-xs"><Presentation size={16}/> TRÌNH CHIẾU</button>
                      <button onClick={() => exportWorksheetToWord(worksheetProblems, wsTopic, wsGrade, wsTime, reflectionQuestions, wsCoreKnowledge, homeworkProblems, wsWarmUp, wsIllustrativeExample, 'LATEX_SOURCE')} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black flex items-center gap-2 text-xs"><Download size={16}/> WORD (Dạng 1 - LaTeX)</button>
                      <button onClick={() => exportWorksheetToWord(worksheetProblems, wsTopic, wsGrade, wsTime, reflectionQuestions, wsCoreKnowledge, homeworkProblems, wsWarmUp, wsIllustrativeExample, 'NATIVE')} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black flex items-center gap-2 text-xs"><FileType size={16}/> WORD (Dạng 2 - Equation)</button>
                      <button onClick={() => exportWorksheetForStudent(worksheetProblems, wsTopic, wsCoreKnowledge, reflectionQuestions, homeworkProblems)} className="px-4 py-2.5 bg-rose-600 text-white rounded-xl font-black flex items-center gap-2 text-xs"><UserCircle size={16}/> WORD (Cho Học sinh)</button>
                      <button onClick={handleExportWorksheetJSON} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl font-black flex items-center gap-2 text-xs"><FileDown size={16}/> JSON</button>
                      <button onClick={() => setStep('WORKSHEET_INPUT')} className="px-4 py-2.5 bg-slate-100 text-slate-400 rounded-xl hover:text-indigo-600 transition-colors"><RefreshCcw size={16}/></button>
                   </div>
                </div>

                {wsWarmUp && (
                  <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="text-xl font-black text-rose-800 flex items-center gap-2">
                            <Lightbulb size={24}/> HOẠT ĐỘNG KHỞI ĐỘNG: {isEditingWarmUp ? '' : wsWarmUp.title}
                        </h3>
                        <button 
                            onClick={() => setIsEditingWarmUp(!isEditingWarmUp)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isEditingWarmUp ? 'bg-rose-600 text-white' : 'bg-white text-rose-600 border border-rose-200'}`}
                        >
                            {isEditingWarmUp ? <Check size={16}/> : <Edit size={16}/>}
                            {isEditingWarmUp ? 'HOÀN TẤT' : 'CHỈNH SỬA'}
                        </button>
                    </div>
                    
                    {isEditingWarmUp ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-rose-400 uppercase tracking-widest">Tên hoạt động</label>
                                <input 
                                    className="w-full p-4 rounded-xl border-2 border-rose-100 focus:border-rose-500 outline-none text-slate-700 font-bold"
                                    value={wsWarmUp.title}
                                    onChange={(e) => setWsWarmUp({...wsWarmUp, title: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-rose-400 uppercase tracking-widest">Nội dung hoạt động</label>
                                        <textarea 
                                            className="w-full p-4 rounded-xl border-2 border-rose-100 focus:border-rose-500 outline-none text-slate-700 font-medium min-h-[150px]"
                                            value={wsWarmUp.content}
                                            onChange={(e) => setWsWarmUp({...wsWarmUp, content: e.target.value})}
                                            onFocus={(e) => activeTextareaRef.current = e.target}
                                        />
                                        <div className="flex flex-wrap gap-1">
                                            {EDUCATIONAL_ICONS.map(icon => (
                                                <button 
                                                    key={icon}
                                                    onClick={() => {
                                                        const textarea = activeTextareaRef.current as HTMLTextAreaElement;
                                                        if (textarea && textarea.selectionStart !== undefined) {
                                                            const start = textarea.selectionStart;
                                                            const end = textarea.selectionEnd;
                                                            const currentText = textarea.value;
                                                            const newText = currentText.substring(0, start) + icon + currentText.substring(end);
                                                            
                                                            // Determine which field to update based on the textarea's current value or some other identifier
                                                            // Since we have multiple textareas, we need to be careful.
                                                            // A better way is to check which field the textarea belongs to.
                                                            if (textarea.value === wsWarmUp.content) {
                                                                setWsWarmUp({...wsWarmUp, content: newText});
                                                            } else if (textarea.value === wsWarmUp.script) {
                                                                setWsWarmUp({...wsWarmUp, script: newText});
                                                            }

                                                            setTimeout(() => {
                                                                textarea.focus();
                                                                textarea.setSelectionRange(start + icon.length, start + icon.length);
                                                            }, 0);
                                                        }
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition-colors text-lg"
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-amber-600 uppercase tracking-widest">Kịch bản sư phạm</label>
                                        <textarea 
                                            className="w-full p-4 rounded-xl border-2 border-amber-100 focus:border-amber-500 outline-none text-slate-700 font-medium min-h-[150px]"
                                            value={wsWarmUp.script}
                                            onChange={(e) => setWsWarmUp({...wsWarmUp, script: e.target.value})}
                                            onFocus={(e) => activeTextareaRef.current = e.target}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-rose-400 uppercase tracking-widest">Ảnh minh họa (Link hoặc từ khóa)</label>
                                        <input 
                                            className="w-full p-4 rounded-xl border-2 border-rose-100 focus:border-rose-500 outline-none text-slate-700"
                                            value={wsWarmUp.imageUrl || ''}
                                            onChange={(e) => setWsWarmUp({...wsWarmUp, imageUrl: e.target.value})}
                                        />
                                    </div>
                                    <div className="aspect-video rounded-2xl overflow-hidden border-2 border-rose-100">
                                        <img 
                                            src={wsWarmUp.imageUrl?.startsWith('http') ? wsWarmUp.imageUrl : `https://picsum.photos/seed/${wsWarmUp.imageUrl || 'math'}/800/800`} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                          {/* Left: Content and Script */}
                          <div className="flex flex-col gap-6">
                            <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-sm flex-1">
                              <div className="text-slate-800 text-lg leading-relaxed font-medium">
                                <MathRenderer content={wsWarmUp.content} />
                              </div>
                            </div>

                            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                              <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2"><UserCircle size={18}/> Kịch bản sư phạm</h4>
                              <div className="text-amber-900/80 italic text-sm leading-relaxed">
                                <MathRenderer content={wsWarmUp.script} />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-rose-200 shadow-sm">
                              <ImageIcon size={20} className="text-rose-400 shrink-0" />
                              <input 
                                type="text" 
                                value={wsWarmUp.imageUrl || ''} 
                                onChange={(e) => setWsWarmUp({...wsWarmUp, imageUrl: e.target.value})}
                                placeholder="Nhập link ảnh minh họa (http...) hoặc từ khóa tiếng Anh"
                                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                              />
                            </div>
                          </div>

                          {/* Right: Large Image */}
                          <div className="flex items-center justify-center min-h-[400px]">
                            <div className="w-full h-full rounded-3xl overflow-hidden shadow-xl border-4 border-white relative group">
                              <img 
                                src={wsWarmUp.imageUrl?.startsWith('http') ? wsWarmUp.imageUrl : `https://picsum.photos/seed/${wsWarmUp.imageUrl || 'math'}/800/800`} 
                                alt="Khởi động" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
                )}

                {wsCoreKnowledge.length > 0 && (
                  <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-indigo-800 flex items-center gap-2"><BookOpen size={24}/> KIẾN THỨC TRỌNG TÂM</h3>
                        <button 
                            onClick={() => setIsEditingCoreKnowledge(!isEditingCoreKnowledge)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isEditingCoreKnowledge ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}
                        >
                            {isEditingCoreKnowledge ? <Check size={16}/> : <Edit size={16}/>}
                            {isEditingCoreKnowledge ? 'HOÀN TẤT' : 'CHỈNH SỬA'}
                        </button>
                    </div>

                    {isEditingCoreKnowledge ? (
                        <div className="space-y-4">
                            {wsCoreKnowledge.map((k, i) => (
                                <div key={i} className="flex gap-2 items-start group">
                                    <div className="flex-1 space-y-2">
                                        <textarea 
                                            className="w-full p-4 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 outline-none text-slate-700 font-medium min-h-[80px] resize-none"
                                            value={k}
                                            onChange={(e) => {
                                                const next = [...wsCoreKnowledge];
                                                next[i] = e.target.value;
                                                setWsCoreKnowledge(next);
                                            }}
                                            onFocus={(e) => activeTextareaRef.current = e.target}
                                        />
                                        <div className="flex flex-wrap gap-1">
                                            {EDUCATIONAL_ICONS.map(icon => (
                                                <button 
                                                    key={icon}
                                                    onClick={() => {
                                                        const next = [...wsCoreKnowledge];
                                                        const currentText = next[i];
                                                        const textarea = activeTextareaRef.current as HTMLTextAreaElement;
                                                        if (textarea && textarea.selectionStart !== undefined) {
                                                            const start = textarea.selectionStart;
                                                            const end = textarea.selectionEnd;
                                                            next[i] = currentText.substring(0, start) + icon + currentText.substring(end);
                                                            setWsCoreKnowledge(next);
                                                            // Restore focus and cursor position
                                                            setTimeout(() => {
                                                                textarea.focus();
                                                                textarea.setSelectionRange(start + icon.length, start + icon.length);
                                                            }, 0);
                                                        } else {
                                                            next[i] = currentText + icon;
                                                            setWsCoreKnowledge(next);
                                                        }
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors text-lg"
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setWsCoreKnowledge(wsCoreKnowledge.filter((_, idx) => idx !== i))}
                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={20}/>
                                    </button>
                                </div>
                            ))}
                            <button 
                                onClick={() => setWsCoreKnowledge([...wsCoreKnowledge, ''])}
                                className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400 font-bold hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={20}/> THÊM KIẾN THỨC MỚI
                            </button>
                        </div>
                    ) : (
                        <ul className="list-disc pl-6 space-y-2 text-slate-700">
                            {wsCoreKnowledge.map((k, i) => (
                                <li key={i}><MathRenderer content={k} /></li>
                            ))}
                        </ul>
                    )}
                  </div>
                )}

                {wsIllustrativeExample && (
                  <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-blue-800 flex items-center gap-2"><Lightbulb size={24}/> VÍ DỤ MINH HOẠ</h3>
                        <button 
                            onClick={() => setIsEditingIllustrativeExample(!isEditingIllustrativeExample)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isEditingIllustrativeExample ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}
                        >
                            {isEditingIllustrativeExample ? <Check size={16}/> : <Edit size={16}/>}
                            {isEditingIllustrativeExample ? 'HOÀN TẤT' : 'CHỈNH SỬA'}
                        </button>
                    </div>

                    {isEditingIllustrativeExample ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-blue-400 uppercase tracking-widest">Công thức áp dụng</label>
                                    <textarea 
                                        className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none text-slate-700 font-medium min-h-[100px]"
                                        value={wsIllustrativeExample.formula}
                                        onChange={(e) => setWsIllustrativeExample({...wsIllustrativeExample, formula: e.target.value})}
                                        onFocus={(e) => activeTextareaRef.current = e.target}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-blue-400 uppercase tracking-widest">Ví dụ cơ bản</label>
                                    <textarea 
                                        className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none text-slate-700 font-medium min-h-[100px]"
                                        value={wsIllustrativeExample.example}
                                        onChange={(e) => setWsIllustrativeExample({...wsIllustrativeExample, example: e.target.value})}
                                        onFocus={(e) => activeTextareaRef.current = e.target}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-amber-600 uppercase tracking-widest">Gợi ý làm bài</label>
                                    <textarea 
                                        className="w-full p-4 rounded-xl border-2 border-amber-100 focus:border-amber-500 outline-none text-slate-700 font-medium min-h-[100px]"
                                        value={wsIllustrativeExample.hint}
                                        onChange={(e) => setWsIllustrativeExample({...wsIllustrativeExample, hint: e.target.value})}
                                        onFocus={(e) => activeTextareaRef.current = e.target}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-emerald-600 uppercase tracking-widest">Lời giải chi tiết</label>
                                    <textarea 
                                        className="w-full p-4 rounded-xl border-2 border-emerald-100 focus:border-emerald-500 outline-none text-slate-700 font-medium min-h-[100px]"
                                        value={wsIllustrativeExample.solution}
                                        onChange={(e) => setWsIllustrativeExample({...wsIllustrativeExample, solution: e.target.value})}
                                        onFocus={(e) => activeTextareaRef.current = e.target}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-purple-400 uppercase tracking-widest">Nhận xét bài</label>
                                <textarea 
                                    className="w-full p-4 rounded-xl border-2 border-purple-100 focus:border-purple-500 outline-none text-slate-700 font-medium min-h-[80px]"
                                    value={wsIllustrativeExample.remarks}
                                    onChange={(e) => setWsIllustrativeExample({...wsIllustrativeExample, remarks: e.target.value})}
                                    onFocus={(e) => activeTextareaRef.current = e.target}
                                />
                            </div>
                            <div className="flex flex-wrap gap-1 bg-white p-4 rounded-2xl border border-blue-100">
                                {EDUCATIONAL_ICONS.map(icon => (
                                    <button 
                                        key={icon}
                                        onClick={() => {
                                            const textarea = activeTextareaRef.current as HTMLTextAreaElement;
                                            if (textarea && textarea.selectionStart !== undefined) {
                                                const start = textarea.selectionStart;
                                                const end = textarea.selectionEnd;
                                                const currentText = textarea.value;
                                                const newText = currentText.substring(0, start) + icon + currentText.substring(end);
                                                
                                                // Update the correct field in wsIllustrativeExample
                                                const updatedExample = { ...wsIllustrativeExample };
                                                if (textarea.value === wsIllustrativeExample.formula) updatedExample.formula = newText;
                                                else if (textarea.value === wsIllustrativeExample.example) updatedExample.example = newText;
                                                else if (textarea.value === wsIllustrativeExample.hint) updatedExample.hint = newText;
                                                else if (textarea.value === wsIllustrativeExample.solution) updatedExample.solution = newText;
                                                else if (textarea.value === wsIllustrativeExample.remarks) updatedExample.remarks = newText;
                                                
                                                setWsIllustrativeExample(updatedExample);

                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.setSelectionRange(start + icon.length, start + icon.length);
                                                }, 0);
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-white border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors text-lg"
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 text-slate-700">
                          <div className="bg-white p-4 rounded-xl border border-blue-200">
                            <span className="font-bold text-blue-700 block mb-2">Công thức áp dụng:</span>
                            <MathRenderer content={wsIllustrativeExample.formula} />
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-blue-200">
                            <span className="font-bold text-blue-700 block mb-2">Ví dụ cơ bản:</span>
                            <MathRenderer content={wsIllustrativeExample.example} />
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-blue-200">
                            <span className="font-bold text-amber-600 block mb-2 cursor-pointer" onClick={() => setShowIllustrativeHint(!showIllustrativeHint)}>
                              Gợi ý làm bài (Phím tắt H): {showIllustrativeHint ? '▼' : '▶'}
                            </span>
                            {showIllustrativeHint && (
                              <div className="mt-2 pt-2 border-t border-amber-100">
                                <MathRenderer content={wsIllustrativeExample.hint} />
                              </div>
                            )}
                          </div>
                          <details className="bg-white p-4 rounded-xl border border-emerald-200 group">
                            <summary className="font-bold text-emerald-700 cursor-pointer list-none flex items-center gap-2">
                              <span className="group-open:hidden">▶</span><span className="hidden group-open:inline">▼</span> Lời giải (Click để xem)
                            </summary>
                            <div className="mt-4 pt-4 border-t border-emerald-100">
                              <MathRenderer content={wsIllustrativeExample.solution} />
                            </div>
                          </details>
                          <div className="bg-white p-4 rounded-xl border border-purple-200">
                            <span className="font-bold text-purple-700 block mb-2">Nhận xét bài:</span>
                            <MathRenderer content={wsIllustrativeExample.remarks} />
                          </div>
                        </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-px bg-slate-200 border-2 border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white">
                   <div className="bg-indigo-50 p-6 text-center border-r border-slate-200">
                      <span className="text-sm font-black text-indigo-700 uppercase tracking-[0.3em]">HƯỚNG DẪN & VÍ DỤ MẪU</span>
                   </div>
                   <div className="bg-emerald-50 p-6 text-center">
                      <span className="text-sm font-black text-emerald-700 uppercase tracking-[0.3em]">BÀI TẬP TỰ LUYỆN</span>
                   </div>

                   {worksheetProblems.map((w, idx) => (
                     <React.Fragment key={idx}>
                        <div className="bg-white p-10 border-r border-b border-slate-100 relative group">
                           <div className="absolute top-6 left-6 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-sm">{idx + 1}a</div>
                           <div className="pl-12 space-y-8">
                              <div className="font-serif text-xl leading-relaxed text-slate-800">
                                 <MathRenderer content={w.example.content} />
                              </div>
                              <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-400">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Lời giải vắn tắt</p>
                                 <div className="font-serif italic text-slate-600 text-sm">
                                    <MathRenderer content={w.example.solution} />
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-slate-200 text-right">
                                    <span className="text-xs font-black text-slate-400 mr-2">ĐÁP SỐ:</span>
                                    <span className="font-bold text-indigo-600"><MathRenderer content={w.example.answer} className="inline-block" /></span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-10 border-b border-slate-100 relative">
                           <div className="absolute top-6 left-6 w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-sm">{idx + 1}b</div>
                           <div className="pl-12 h-full flex flex-col">
                              <div className="font-serif text-xl leading-relaxed text-slate-800 flex-1">
                                 <MathRenderer content={w.practice.content} />
                              </div>
                              <div className="mt-8 pt-8 border-t border-slate-50 space-y-6">
                                 <div className="h-6 border-b border-dashed border-slate-200"></div>
                                 <div className="h-6 border-b border-dashed border-slate-200"></div>
                                 <div className="h-6 border-b border-dashed border-slate-200"></div>
                                 <div className="text-right">
                                    <span className="text-xs font-black text-slate-300 mr-2">ĐÁP SỐ: ...........................</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </React.Fragment>
                   ))}
                </div>

                {homeworkProblems && homeworkProblems.length > 0 && (
                   <div className="bg-white p-10 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl">
                      <div className="flex items-center gap-4 mb-8">
                         <BookOpen className="text-indigo-500" size={32}/>
                         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bài Tập Về Nhà</h3>
                      </div>
                      <div className="space-y-6">
                         {homeworkProblems.map((q, i) => (
                           <div key={i} className="flex gap-4 items-start bg-slate-50 p-6 rounded-2xl border-l-8 border-indigo-500">
                              <span className="font-black text-indigo-600 text-xl">{i + 1}.</span>
                              <div className="text-slate-700 text-lg font-medium">
                                 <MathRenderer content={q.content} />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}

                {reflectionQuestions.length > 0 && (
                   <div className="bg-white p-10 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl">
                      <div className="flex items-center gap-4 mb-8">
                         <Lightbulb className="text-indigo-500" size={32}/>
                         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Củng Cố & Ghi Nhớ</h3>
                      </div>
                      <div className="space-y-6">
                         {reflectionQuestions.map((q, i) => (
                           <div key={i} className="flex gap-4 items-start bg-slate-50 p-6 rounded-2xl border-l-8 border-indigo-500">
                              <span className="font-black text-indigo-600 text-xl">{i + 1}.</span>
                              <div className="text-slate-700 text-lg font-medium">
                                 <MathRenderer content={q} />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
            {/* ... Bank View ... */}
            <div className="bg-white p-10 rounded-[2rem] border shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                <h2 className="text-2xl font-black text-slate-800">Quản Lý Ngân Hàng</h2>
                
                {/* Bank Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setBankTab('QUESTIONS')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${bankTab === 'QUESTIONS' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Kho Câu Hỏi
                    </button>
                    <button 
                        onClick={() => setBankTab('PRESENTATIONS')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${bankTab === 'PRESENTATIONS' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Kho Bài Giảng
                    </button>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleFullBackup} className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-xs font-black hover:bg-teal-100 transition-all border border-teal-200">
                      <Archive size={16}/> SAO LƯU HỆ THỐNG
                  </button>
                  <button onClick={() => fullBackupImportRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-slate-900 transition-all shadow-md">
                      <ArchiveRestore size={16}/> KHÔI PHỤC HỆ THỐNG
                  </button>
                  <input type="file" ref={fullBackupImportRef} className="hidden" accept=".json" onChange={handleFullImport} />
                </div>
              </div>

              {bankTab === 'QUESTIONS' ? (
                  <>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[300px] group">
                        <Search className="absolute left-6 top-4 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm nội dung hoặc chuyên đề..." 
                            className="pl-16 w-full p-4 border-2 border-slate-100 rounded-2xl outline-none font-bold focus:border-indigo-500" 
                            value={bankSearch} 
                            onChange={(e) => setBankSearch(e.target.value)} 
                        />
                        </div>
                        
                        <div className="flex gap-4 w-full md:w-auto">
                        <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="flex-1 md:flex-none p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none text-xs uppercase tracking-widest">
                            <option value="ALL">TẤT CẢ CHUYÊN ĐỀ</option>
                            {uniqueTopics.map(topic => (<option key={topic} value={topic}>{topic}</option>))}
                        </select>
                        <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="flex-1 md:flex-none p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none text-xs uppercase tracking-widest">
                            <option value="ALL">TẤT CẢ CẤP ĐỘ/LỚP</option>
                            {uniqueGrades.map(grade => (<option key={grade} value={grade}>{grade}</option>))}
                        </select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button onClick={() => handleBankAction('PRESENT')} disabled={selectedBankIds.size === 0} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black disabled:opacity-30 hover:bg-indigo-700 transition-all shadow-lg">
                        <Presentation size={20}/> TRÌNH CHIẾU {selectedBankIds.size > 0 && `(${selectedBankIds.size})`}
                        </button>
                        <button onClick={() => handleBankAction('WORD')} disabled={selectedBankIds.size === 0} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black disabled:opacity-30 hover:bg-emerald-700 transition-all shadow-lg">
                        <Download size={20}/> XUẤT WORD
                        </button>
                        <button onClick={() => setSelectedBankIds(new Set())} className="px-6 py-3 bg-white text-slate-400 border border-slate-200 rounded-xl font-black hover:text-red-500 transition-all">
                        BỎ CHỌN TẤT CẢ
                        </button>
                    </div>

                    <div className="grid gap-6">
                        {filteredBankItems.length > 0 ? filteredBankItems.map((item) => (
                            <div key={item.id} className={`bg-white p-10 rounded-[2rem] border-2 transition-all cursor-pointer relative ${selectedBankIds.has(item.id) ? 'border-indigo-500 shadow-2xl bg-indigo-50/10' : 'border-slate-100 shadow-sm hover:border-slate-300'}`} onClick={() => { const s = new Set(selectedBankIds); if (s.has(item.id)) s.delete(item.id); else s.add(item.id); setSelectedBankIds(s); }}>
                            <div className="absolute top-8 right-8 flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedBankIds.has(item.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}>
                                {selectedBankIds.has(item.id) && <Check size={14} strokeWidth={4} />}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); deleteFromBank(item.id); setBankItems(getBankItems()); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                            </div>
                            <div className="flex gap-3 mb-6">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full uppercase tracking-widest">{item.topic}</span>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full uppercase tracking-widest">{item.grade}</span>
                                <DifficultyBadge level={item.difficulty} />
                            </div>
                            <div className="font-serif text-2xl leading-relaxed text-slate-800">
                                <MathRenderer content={item.originalContent} />
                            </div>
                            <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-50">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Đã lưu: {new Date(item.savedAt).toLocaleDateString()}</div>
                            </div>
                            </div>
                        )) : (
                            <div className="bg-white p-20 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
                            <FileText className="mx-auto mb-6 text-slate-200" size={64}/>
                            <p className="text-xl font-bold text-slate-400">Không tìm thấy bài toán nào phù hợp.</p>
                            </div>
                        )}
                    </div>
                  </>
              ) : (
                  <div className="min-h-[400px]">
                      <div className="mb-6 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                              <HardDrive size={24} />
                          </div>
                          <div>
                              <h3 className="font-bold text-indigo-900 text-lg">Cây Thư Mục Bài Giảng</h3>
                              <p className="text-slate-600 text-sm mt-1">
                                  Duyệt và trình chiếu các bộ đề thi đã lưu theo cấu trúc lớp học (Lớp 6 - Lớp 12).
                                  Bạn có thể lưu bài giảng tại màn hình Trình Chiếu.
                              </p>
                          </div>
                      </div>
                      
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[500px]">
                          {renderFolderTree(null)}
                      </div>
                  </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* SPLIT-VIEW EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-slideUp">
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
                    <button onClick={cancelEdit} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-red-500"><X size={24} /></button>
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
                                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <PenLine size={14}/> {editingItem.type === 'RESULT' ? 'Tiêu đề' : 'Tiêu đề (Bài Gốc)'}
                                  </label>
                                  <input 
                                    className="w-full p-4 border-2 border-slate-100 rounded-xl font-bold text-lg focus:border-indigo-500 outline-none transition-all"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                    onFocus={(e) => handleFieldFocus('title', e)}
                                    placeholder="Nhập tiêu đề..."
                                  />
                              </div>

                              <div className="space-y-3">
                                  <label className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                      <FileText size={14}/> Nội dung câu hỏi (LaTeX)
                                  </label>
                                  <textarea 
                                    className="w-full p-6 border-2 border-indigo-50 bg-indigo-50/10 rounded-2xl font-serif text-lg h-64 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                                    value={editForm.content}
                                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                                    onFocus={(e) => handleFieldFocus('content', e)}
                                    placeholder="Nhập nội dung đề bài (dùng $...$ cho công thức)..."
                                  />
                              </div>

                              <div className="space-y-3">
                                  <label className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                      <Lightbulb size={14}/> Hướng dẫn giải / Đáp án
                                  </label>
                                  <textarea 
                                    className="w-full p-6 border-2 border-emerald-50 bg-emerald-50/10 rounded-2xl font-serif text-base h-64 focus:border-emerald-500 outline-none transition-all resize-none shadow-inner"
                                    value={editForm.solution}
                                    onChange={(e) => setEditForm({...editForm, solution: e.target.value})}
                                    onFocus={(e) => handleFieldFocus('solution', e)}
                                    placeholder="Nhập lời giải chi tiết..."
                                  />
                              </div>

                              <div className="space-y-3">
                                  <label className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                      <Edit size={14}/> Rút kinh nghiệm
                                  </label>
                                  <textarea 
                                    className="w-full p-6 border-2 border-amber-50 bg-amber-50/10 rounded-2xl font-serif text-base h-32 focus:border-amber-500 outline-none transition-all resize-none shadow-inner"
                                    value={editForm.reflectionNotes}
                                    onChange={(e) => setEditForm({...editForm, reflectionNotes: e.target.value})}
                                    onFocus={(e) => handleFieldFocus('reflectionNotes', e)}
                                    placeholder="Nhập phần rút kinh nghiệm cho bài tập này..."
                                  />
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
                                 <h4 className="text-indigo-600 font-bold border-b border-indigo-100 pb-2 mb-4">ĐỀ BÀI: {editForm.title}</h4>
                                 <div className="font-serif text-2xl text-slate-800 leading-relaxed bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                                      <MathRenderer content={editForm.content || "(Chưa có nội dung)"} />
                                 </div>
                             </div>

                             {/* Solution Preview */}
                             <div className="space-y-4">
                                 <h4 className="text-emerald-600 font-bold border-b border-emerald-100 pb-2 mb-4">HƯỚNG DẪN GIẢI</h4>
                                 <div className="font-serif text-lg text-slate-700 leading-loose italic bg-white p-8 rounded-2xl border-l-4 border-emerald-400 shadow-sm">
                                      <MathRenderer content={editForm.solution || "(Chưa có lời giải)"} />
                                 </div>
                             </div>

                             {/* Reflection Preview */}
                             <div className="space-y-4">
                                 <h4 className="text-amber-600 font-bold border-b border-amber-100 pb-2 mb-4 uppercase tracking-widest text-xs">Rút kinh nghiệm</h4>
                                 <div className="italic text-slate-600 bg-amber-50/30 p-6 rounded-xl border border-amber-100">
                                      {editForm.reflectionNotes || "(Chưa có phần rút kinh nghiệm)"}
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-4 shrink-0">
                    <button onClick={cancelEdit} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Hủy bỏ</button>
                    <button onClick={saveEdit} className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95">
                        <Save size={18} /> LƯU THAY ĐỔI
                    </button>
                </div>
            </div>
        </div>
      )}

      {presentationMode && (
        <PresentationView 
          problems={presentationProblems} 
          initialIndex={0} 
          onClose={() => setPresentationMode(false)}
          initialBackgrounds={backgroundImages}
          onUpdateBackgrounds={setBackgroundImages}
          onUpdateProblem={handleUpdateProblem}
          currentPresentationId={currentPresentationId}
        />
      )}

      {showApiModal && (
        <ApiKeyModal onClose={() => setShowApiModal(false)} />
      )}
    </div>
  );
};

export default App;
