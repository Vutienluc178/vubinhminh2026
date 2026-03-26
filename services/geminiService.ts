
import { GoogleGenAI, Type } from "@google/genai";
import { ProblemAnalysis, GeneratedProblem, ExamConfig, StudentLevel, InputFile, WorksheetProblem, WorksheetData } from "../types";

const API_KEY_STORAGE = "USER_GEMINI_API_KEY";

export const getUserApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE);
};

export const setUserApiKey = (key: string) => {
  localStorage.setItem(API_KEY_STORAGE, key);
};

export const clearUserApiKey = () => {
  localStorage.removeItem(API_KEY_STORAGE);
};

const getAI = () => {
    const userKey = getUserApiKey();
    // Ưu tiên key của người dùng, nếu không có thì dùng key môi trường
    const apiKey = userKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
        throw new Error("Chưa cấu hình API Key. Vui lòng vào Cài đặt để nhập Gemini API Key.");
    }
    return new GoogleGenAI({ apiKey });
};

const getStudentLevelContext = (level: StudentLevel): string => {
    switch (level) {
        case 'BASIC': return "Mức độ Cơ bản: Công thức trực tiếp, số liệu dễ tính toán.";
        case 'AVERAGE': return "Mức độ Trung bình: Yêu cầu kết nối kiến thức cơ bản.";
        case 'GOOD': return "Mức độ Khá: Cần biến đổi trung gian.";
        case 'EXCELLENT': return "Mức độ Giỏi: Vận dụng cao, các bài toán lấy điểm 9, 10.";
        case 'OLYMPIC': return "Mức độ Olympic/Chuyên: Kỹ thuật đặc thù (Bất biến, Dirichlet, Cực hạn, Đồ thị, Số học nâng cao...).";
        case 'BLOOM_SYNTHESIS': return "Mức độ Bloom Tổng hợp: Yêu cầu học sinh kết hợp nhiều mảng kiến thức, tư duy phân tích, đánh giá và sáng tạo giải pháp mới.";
        default: return "Học sinh phổ thông.";
    }
}

export const analyzeMathProblem = async (
  problemText: string,
  file?: InputFile
): Promise<ProblemAnalysis[]> => {
  const ai = getAI();
  const smartModel = "gemini-3-pro-preview";

  const prompt = `
    Bạn là CHUYÊN GIA TOÁN HỌC OLYMPIC (ra đề–thẩm định–huấn luyện), có khả năng thiết kế hệ thống bài toán từ nền tảng đến HSG.
    Nhiệm vụ: Phân tích tài liệu đầu vào.
    
    YÊU CẦU QUY TẮC TOÁN HỌC (BẮT BUỘC):
    1. Trích xuất chính xác đề bài, LUÔN LUÔN giữ mọi ký hiệu toán học trong cặp dấu $...$.
    2. Với ký hiệu VECTƠ: Luôn dùng $\\vec{AB}$ hoặc $\\vec{u}$.
    3. Với HỆ PHƯƠNG TRÌNH: Sử dụng dấu \`;\` để ngăn cách các phương trình bên trong dấu $...$ (Ví dụ: $\\begin{cases} x+y=1 ; 2x-y=3 \\end{cases}$) để đảm bảo tính tương thích khi xuất Word.
    4. Không được để công thức trần.
    
    LUÔN TRẢ VỀ JSON array.
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (file) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  }
  
  if (problemText) {
    parts.push({ text: `Mô tả bổ sung hoặc nội dung văn bản: ${problemText}` });
  }

  const response = await ai.models.generateContent({
    model: smartModel,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            originalContent: { type: Type.STRING },
            topic: { type: Type.STRING },
            grade: { type: Type.STRING },
            coreTechnique: { type: Type.STRING },
            difficulty: { type: Type.INTEGER },
            coreIdea: { type: Type.STRING },
            suggestedSolution: { type: Type.STRING },
            potentialVariations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["originalContent", "topic", "grade", "coreTechnique", "difficulty", "coreIdea", "suggestedSolution", "potentialVariations"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const generateExamSet = async (
  analysisList: ProblemAnalysis[],
  config: ExamConfig
): Promise<GeneratedProblem[]> => {
  const ai = getAI();
  const modelId = "gemini-3-pro-preview";
  const levelContext = getStudentLevelContext(config.studentLevel);

  const prompt = `
    Dựa trên danh sách bài toán đã phân tích: ${JSON.stringify(analysisList)}
    Hãy tạo ${config.quantity} bộ câu hỏi mới.
    Đối tượng: ${levelContext}.

    QUY TẮC VIẾT CÔNG THỨC QUAN TRỌNG:
    1. Mọi công thức toán học bắt buộc phải nằm trong dấu $...$.
    2. Với ký hiệu VECTƠ: Luôn dùng $\\vec{AB}$.
    3. Với HỆ PHƯƠNG TRÌNH: Sử dụng dấu \`;\` để ngăn cách các dòng phương trình bên trong dấu $...$ (Ví dụ: $\\begin{cases} x+y=1 ; x-y=0 \\end{cases}$). Điều này cực kỳ quan trọng để trình xuất Word Equation không bị lỗi.
    4. Tuyệt đối không để LaTeX trần mà không có dấu $.
    
    YÊU CẦU LỜI GIẢI: Ngắn gọn, súc tích. Gộp các bước biến đổi đơn giản vào cùng một dòng để tiết kiệm không gian.

    Cấu trúc trả về JSON GeneratedProblem.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            difficulty: { type: Type.INTEGER },
            techniqueUsed: { type: Type.STRING },
            solution: { type: Type.STRING },
            teacherNotes: { type: Type.STRING },
            presentation: {
              type: Type.OBJECT,
              properties: {
                questionSummary: { type: Type.STRING },
                solutionSummary: { type: Type.STRING },
                finalResult: { type: Type.STRING }
              },
              required: ["questionSummary", "solutionSummary", "finalResult"]
            }
          },
          required: ["id", "title", "content", "difficulty", "techniqueUsed", "solution", "teacherNotes", "presentation"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const generateWorksheet = async (
  topic: string,
  grade: string,
  timeLimit: number,
  level: string = 'AVERAGE',
  goal: string = 'SKILL', // SKILL | THEORY | EXAM
  quantity: number = 5,
  homeworkQuantity: number = 3,
  context: string = '',
  file?: InputFile
): Promise<WorksheetData> => {
  const ai = getAI();
  const modelId = "gemini-3-pro-preview";

  // Điều chỉnh prompt để nhấn mạnh sự ngắn gọn
  let pedagogicalInstruction = "";
  if (goal === 'THEORY') {
      pedagogicalInstruction = "Tập trung hiểu bản chất, nhưng lời giải ví dụ phải NGẮN GỌN, SÚC TÍCH, đi thẳng vào vấn đề.";
  } else if (goal === 'EXAM') {
      pedagogicalInstruction = "Tập trung các mẹo giải nhanh, trình bày tối ưu hóa cho việc thi trắc nghiệm hoặc tự luận ngắn.";
  } else {
      pedagogicalInstruction = "Tập trung rèn kỹ năng tính toán, lời giải gọn gàng, dễ nhìn.";
  }
  
  let levelDescription = "";
  if (level === 'BLOOM_SYNTHESIS') {
      levelDescription = "Mức độ Bloom Tổng hợp: Yêu cầu phối hợp nhiều đơn vị kiến thức, đòi hỏi tư duy phân tích và đánh giá cao.";
  } else {
      levelDescription = level;
  }

  const prompt = `
    Với Giáo viên Toán THPT 20 năm kinh nghiệm đồng thời là Nhà giáo dục xuất sắc và chuyên gia thiết kế học liệu theo năng lực, có nhiệm vụ thiết kế PHIẾU HỌC TẬP & BÀI TẬP VỀ NHÀ chất lượng cao.
    
    THÔNG TIN ĐẦU VÀO:
    - Chủ đề: ${topic}
    - Lớp: ${grade}
    - Trình độ học sinh: ${levelDescription}.
    - Mục tiêu: ${pedagogicalInstruction}
    - Số lượng dạng bài trên lớp: ${quantity}.
    - Số lượng bài tập về nhà: ${homeworkQuantity}.
    - Ngữ cảnh / Dữ liệu bổ sung: "${context}".
    ${file ? "(LƯU Ý: Hãy phân tích kỹ tài liệu/hình ảnh được đính kèm để trích xuất dạng bài và nội dung phù hợp)" : ""}

    YÊU CẦU QUAN TRỌNG VỀ LỜI GIẢI (ĐỂ IN ẤN):
    1. Lời giải Ví Dụ Mẫu phải CỰC KỲ NGẮN GỌN, SÚC TÍCH.
    2. Phần thay số: Viết gộp trên cùng 1 dòng hoặc tối đa 2 dòng. KHÔNG trình bày dông dài từng bước nhỏ như sách giáo khoa.
    3. Sử dụng ký hiệu toán học ($...$) thay cho lời văn (Ví dụ: Dùng "$\\Rightarrow$" thay vì "Suy ra", "Ta có").

    YÊU CẦU CẤU TRÚC JSON:
    1. warmUpActivity: Tạo một Hoạt động khởi động gắn với thực tế để dẫn dắt vào bài học. Kèm theo kịch bản sư phạm (script) để giáo viên dẫn dắt, và một từ khóa tiếng Anh (imageUrl) để tìm ảnh minh họa (ví dụ: "apple", "car", "bridge").
    2. coreKnowledge: công thức cốt lõi nhất (Ngắn gọn).
    3. illustrativeExample: Một ví dụ minh hoạ bao gồm: Công thức áp dụng (formula), Ví dụ cơ bản (example), Gợi ý làm bài (hint), Lời giải (solution), Nhận xét bài (remarks).
    4. problems: Danh sách ${quantity} bài toán thực hành trên lớp (Ví dụ + Tự luyện).
    5. homework: Danh sách ${homeworkQuantity} bài tập về nhà với các yêu cầu:
       - Phải phân loại theo thang đo Bloom: [Nhận biết], [Thông hiểu], [Vận dụng], [Vận dụng cao].
       - BẮT BUỘC có ít nhất 2 bài toán thực tế (Real-world application) để học sinh thấy ứng dụng của toán học.
       - Phần lời giải (solution) cho BTVN sẽ được in ở phần riêng, nên hãy viết chi tiết hơn một chút so với bài trên lớp.
    6. reflectionQuestions: 3 câu hỏi củng cố ngắn.
    
    Trả về JSON WorksheetData.
  `;

  // Construct parts for multimodal input
  const parts: any[] = [{ text: prompt }];
  if (file) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          grade: { type: Type.STRING },
          time: { type: Type.INTEGER },
          warmUpActivity: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              script: { type: Type.STRING },
              imageUrl: { type: Type.STRING }
            },
            required: ["title", "content", "script"]
          },
          coreKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
          illustrativeExample: {
            type: Type.OBJECT,
            properties: {
              formula: { type: Type.STRING },
              example: { type: Type.STRING },
              hint: { type: Type.STRING },
              solution: { type: Type.STRING },
              remarks: { type: Type.STRING }
            },
            required: ["formula", "example", "hint", "solution", "remarks"]
          },
          problems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                example: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING },
                    solution: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ["content", "solution", "answer"]
                },
                practice: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ["content", "answer"]
                }
              },
              required: ["id", "title", "example", "practice"]
            }
          },
          homework: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    content: { type: Type.STRING },
                    bloomLevel: { type: Type.STRING },
                    isRealWorld: { type: Type.BOOLEAN },
                    solution: { type: Type.STRING },
                    answer: { type: Type.STRING }
                },
                required: ["content", "bloomLevel", "isRealWorld", "solution", "answer"]
            }
          },
          reflectionQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["topic", "grade", "time", "coreKnowledge", "problems", "homework", "reflectionQuestions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
