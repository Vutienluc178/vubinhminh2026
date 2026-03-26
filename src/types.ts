
export enum DifficultyLevel {
  WARMUP = 1,
  STANDARD = 2,
  ADVANCED = 3,
  OLYMPIC = 4,
  LEGENDARY = 5
}

export type GenerationMode = 'PARALLEL' | 'CREATIVE';

export type StudentLevel = 'BASIC' | 'AVERAGE' | 'GOOD' | 'EXCELLENT' | 'OLYMPIC' | 'BLOOM_SYNTHESIS';

export interface InputFile {
  data: string; // base64
  mimeType: string;
  name: string;
}

export interface ProblemAnalysis {
  originalContent: string; 
  topic: string;
  grade: string; 
  coreTechnique: string;
  difficulty: number;
  coreIdea: string;
  suggestedSolution?: string; 
  potentialVariations: string[];
  reflectionNotes?: string;
}

export interface BankItem extends ProblemAnalysis {
  id: string;
  savedAt: number;
}

export interface PresentationData {
  questionSummary: string; 
  solutionSummary: string; 
  finalResult: string; 
}

export interface GeneratedProblem {
  id: string;
  title: string;
  content: string;
  difficulty: number;
  techniqueUsed: string;
  solution: string;
  teacherNotes: string; 
  hint?: string;
  remarks?: string;
  presentation: PresentationData; 
  imageUrl?: string;
  reflectionNotes?: string;
}

export interface WorksheetProblem {
  id: string;
  title: string;
  example: {
    content: string;
    solution: string;
    answer: string;
  };
  practice: {
    content: string;
    answer: string;
  };
}

export interface HomeworkProblem {
  content: string;
  bloomLevel: string; // Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao
  isRealWorld: boolean;
  solution: string;
  answer: string;
}

export interface WorksheetData {
  topic: string;
  grade: string;
  time: number;
  warmUpActivity?: {
    title: string;
    content: string;
    script: string;
    imageUrl?: string;
  };
  coreKnowledge: string[];
  illustrativeExample?: {
    formula: string;
    example: string;
    hint: string;
    solution: string;
    remarks: string;
  };
  problems: WorksheetProblem[];
  homework: HomeworkProblem[];
  reflectionQuestions: string[];
}

export interface ExamConfig {
  mode: GenerationMode; 
  studentLevel: StudentLevel; 
  quantity: number; 
  startDifficulty: number;
  endDifficulty: number;
  includeSolutions: boolean;
  includeHints: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null means root
  createdAt: number;
}

export interface SavedPresentation {
  id: string;
  name: string;
  folderId: string;
  problems: GeneratedProblem[];
  createdAt: number;
  updatedAt?: number;
  reflectionNotes?: string;
}

export type AppStep = 'INPUT' | 'ANALYSIS' | 'CONFIG' | 'GENERATION' | 'RESULT' | 'WORKSHEET_INPUT' | 'WORKSHEET_RESULT';
