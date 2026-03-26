
import saveAs from "file-saver";
import katex from "katex";
import { asBlob } from "html-docx-js-typescript";
import { GeneratedProblem, WorksheetProblem, HomeworkProblem } from "../types";

// --- CORE UTILS ---

/**
 * Converts a text containing LaTeX ($...$) into HTML.
 * For .docx export using html-docx-js, complex MathML might not render perfectly.
 * We optimize for readability.
 */
const processContentToHtml = (text: string, isLatexSourceMode: boolean = false): string => {
  if (!text) return "";

  // Split by $ to find LaTeX segments
  const segments = text.split("$");
  let html = "";

  segments.forEach((segment, index) => {
    // Even index = Plain Text
    if (index % 2 === 0) {
      let safeText = segment
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\\\\/g, "<br/>") 
        .replace(/\n/g, "<br/>");
      
      safeText = safeText
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*?)\*/g, "<i>$1</i>");

      html += `<span>${safeText}</span>`;
    } 
    // Odd index = Math (LaTeX)
    else {
      if (segment.trim() === "") return;

      if (isLatexSourceMode) {
        html += `<span style="color: #D32F2F; font-family: 'Courier New', monospace;">$${segment}$</span>`;
      } else {
        try {
          // Render to MathML for "Native" feel, though html-docx support varies.
          // Fallback to simple colored text if needed, but we keep MathML structure 
          // in hopes that Word processes it or user accepts it.
          const mathML = katex.renderToString(segment, {
            throwOnError: false,
            output: 'mathml',
            displayMode: false,
          });

          // Extract pure math tag
          const mathMatch = mathML.match(/<math[\s\S]*?<\/math>/);
          if (mathMatch) {
            let cleanMath = mathMatch[0];
            cleanMath = cleanMath.replace(/<annotation encoding="application\/x-tex">[\s\S]*?<\/annotation>/, '');
            html += cleanMath;
          } else {
            html += `<span style="color: #eab308; font-weight: bold;">$${segment}$</span>`;
          }
        } catch (e) {
          console.error("KaTeX Error", e);
          html += `<span style="color: red;">$${segment}$</span>`;
        }
      }
    }
  });

  return html;
};

/**
 * Creates a valid Word .docx file from HTML content using html-docx-js.
 */
const saveHtmlAsDocx = async (bodyContent: string, fileName: string, isCompact: boolean = false) => {
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Export</title>
      <style>
        @page { size: A4; margin: 1.27cm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: ${isCompact ? '1.0' : '1.5'}; }
        h1 { font-size: 16pt; font-weight: bold; text-align: center; color: #000; margin: ${isCompact ? '4pt 0' : '12pt 0'}; }
        h2 { font-size: 14pt; font-weight: bold; color: #000; margin-top: ${isCompact ? '8pt' : '18pt'}; margin-bottom: ${isCompact ? '2pt' : '6pt'}; border-bottom: 1px solid #000; }
        h3 { font-size: 13pt; font-weight: bold; color: #2E74B5; margin-top: ${isCompact ? '6pt' : '12pt'}; }
        .problem-box { margin-bottom: ${isCompact ? '4pt' : '12pt'}; }
        .meta-info { font-size: 10pt; color: #555; font-style: italic; margin-bottom: 4pt; }
        .solution-box { border-left: 3px solid #F59E0B; padding-left: 10px; margin-top: 8px; background-color: #fafafa; }
        .teacher-note { color: #B45309; font-style: italic; font-weight: bold; }
        p { margin: ${isCompact ? '0' : '6pt 0'}; }
        
        table { width: 100%; border-collapse: collapse; margin-top: ${isCompact ? '4pt' : '10pt'}; margin-bottom: ${isCompact ? '4pt' : '10pt'}; }
        td, th { border: 1px solid #000; padding: ${isCompact ? '4pt' : '8pt'}; vertical-align: top; }
        .header-cell { background-color: #e0e7ff; font-weight: bold; text-align: center; }
        .header-cell-practice { background-color: #d1fae5; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `;

  try {
      // @ts-ignore
      const blob = await asBlob(fullHtml, {
          orientation: 'portrait',
          margins: { top: 720, right: 720, bottom: 720, left: 720 }
      }) as Blob;
      saveAs(blob, fileName);
  } catch (error) {
      console.error("Docx Export Error:", error);
      alert("Lỗi xuất file .docx. Đang thử phương án dự phòng...");
      // Fallback to simple text/html logic if lib fails
      const fallbackBlob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
      saveAs(fallbackBlob, fileName.replace('.docx', '.doc'));
  }
};

// Helper to ensure math is rendered correctly even if AI forgets delimiters
const formatMath = (text: string) => {
    if (!text) return "";
    if (text.includes('\\') && !text.includes('$')) {
        return `$${text}$`;
    }
    return text;
};

// --- EXPORT FUNCTIONS ---

export const exportToWord = async (
  problems: GeneratedProblem[], 
  topic: string, 
  mode: 'NATIVE' | 'LATEX_SOURCE' = 'NATIVE'
) => {
  if (!problems || problems.length === 0) return;

  const isLatexMode = mode === 'LATEX_SOURCE';
  let body = "";

  body += `<h1>ĐỀ THI OLYMPIC TOÁN HỌC</h1>`;
  body += `<p style="text-align:center; font-size:12pt;"><strong>Chuyên đề: ${topic.toUpperCase()}</strong></p>`;
  body += `<p style="text-align:center; font-size:10pt;"><em>(Định dạng: ${isLatexMode ? 'LaTeX Source' : 'Standard Equation'})</em></p>`;
  body += `<hr/>`;

  problems.forEach((prob, index) => {
    body += `<div class="problem-box">`;
    body += `<h3>Câu ${index + 1}: ${prob.title}</h3>`;
    body += `<div class="meta-info">[Mức độ: ${prob.difficulty}/5] - [Kỹ thuật: ${prob.techniqueUsed}]</div>`;
    body += `<p>${processContentToHtml(prob.content, isLatexMode)}</p>`;
    body += `</div>`;
  });

  body += `<br clear="all" style="page-break-before:always" />`;
  body += `<h1>HƯỚNG DẪN GIẢI CHI TIẾT & ĐÁP ÁN</h1>`;

  problems.forEach((prob, index) => {
    body += `<div class="problem-box">`;
    body += `<h3>Lời giải Câu ${index + 1}</h3>`;
    
    if (prob.teacherNotes) {
      body += `<div style="margin-bottom: 5px; color: #B45309;">`;
      body += `<strong>Góc nhìn chuyên gia: </strong>`;
      body += processContentToHtml(prob.teacherNotes, isLatexMode);
      body += `</div>`;
    }

    body += `<div class="solution-box">`;
    body += processContentToHtml(prob.solution, isLatexMode);
    body += `</div>`;

    if (prob.reflectionNotes) {
      body += `<div style="margin-top: 10px; padding: 8px; background-color: #fef3c7; border: 1px dashed #d97706; border-radius: 4px;">`;
      body += `<strong style="color: #92400e;">Rút kinh nghiệm: </strong>`;
      body += `<span>${prob.reflectionNotes}</span>`;
      body += `</div>`;
    }

    body += `</div>`;
  });

  const suffix = isLatexMode ? '_latex.docx' : '_equation.docx';
  const fileName = `Olympic_Math_${topic.replace(/\s+/g, '_')}${suffix}`;
  
  await saveHtmlAsDocx(body, fileName);
};

export const exportWorksheetToWord = async (
  worksheet: WorksheetProblem[], 
  topic: string, 
  grade: string, 
  time: number, 
  reflectionQuestions: string[],
  coreKnowledge: string[] = [],
  homework: HomeworkProblem[] = [],
  warmUp: {title: string, content: string, script: string, imageUrl?: string} | null = null,
  illustrativeExample: {formula: string, example: string, hint: string, solution: string, remarks: string} | null = null,
  mode: 'NATIVE' | 'LATEX_SOURCE' = 'LATEX_SOURCE'
) => {
  const isLatexMode = mode === 'LATEX_SOURCE';
  let body = "";

  body += `<h1>PHIẾU HỌC TẬP TOÁN HỌC</h1>`;
  body += `<p style="text-align:center;"><strong>Chủ đề: ${topic.toUpperCase()}</strong></p>`;
  body += `<p style="text-align:center; font-size: 10pt;"><em>Lớp: ${grade} | Thời lượng: ${time} phút</em></p>`;
  
  if (warmUp) {
    body += `<h2>HOẠT ĐỘNG KHỞI ĐỘNG: ${warmUp.title}</h2>`;
    body += `<p>${processContentToHtml(warmUp.content, isLatexMode)}</p>`;
    body += `<div class="teacher-note" style="margin-top: 8px; padding: 8px; background-color: #fffbeb; border-left: 3px solid #f59e0b;">`;
    body += `<strong>Kịch bản sư phạm: </strong>${processContentToHtml(warmUp.script, isLatexMode)}`;
    body += `</div>`;
  }

  if (coreKnowledge.length > 0) {
    body += `<h2>KIẾN THỨC CẦN NHỚ</h2>`;
    body += `<ul>`;
    coreKnowledge.forEach(k => {
      body += `<li>${processContentToHtml(k, isLatexMode)}</li>`;
    });
    body += `</ul>`;
  }

  if (illustrativeExample) {
    body += `<h2>VÍ DỤ MINH HOẠ</h2>`;
    body += `<div style="border: 1px solid #93c5fd; padding: 12px; border-radius: 8px; margin-bottom: 16px; background-color: #eff6ff;">`;
    body += `<p><strong>Công thức áp dụng: </strong>${processContentToHtml(illustrativeExample.formula, isLatexMode)}</p>`;
    body += `<p><strong>Ví dụ cơ bản: </strong>${processContentToHtml(illustrativeExample.example, isLatexMode)}</p>`;
    body += `<p><strong>Gợi ý làm bài: </strong>${processContentToHtml(illustrativeExample.hint, isLatexMode)}</p>`;
    body += `<p><strong>Lời giải: </strong>${processContentToHtml(illustrativeExample.solution, isLatexMode)}</p>`;
    body += `<p><strong>Nhận xét bài: </strong>${processContentToHtml(illustrativeExample.remarks, isLatexMode)}</p>`;
    body += `</div>`;
  }

  body += `<table>`;
  body += `<tr>`;
  body += `<td class="header-cell" width="50%">HƯỚNG DẪN & VÍ DỤ MẪU</td>`;
  body += `<td class="header-cell-practice" width="50%">BÀI TẬP TỰ LUYỆN</td>`;
  body += `</tr>`;

  worksheet.forEach((w, idx) => {
    body += `<tr>`;
    
    // Left Column
    body += `<td width="50%">`;
    body += `<p><strong style="color:#2E74B5">${idx + 1}a. Ví dụ:</strong></p>`;
    body += `<p>${processContentToHtml(w.example.content, isLatexMode)}</p>`;
    
    body += `<div style="margin-top: 8px; border-top: 1px dotted #ccc; padding-top: 4px;">`;
    body += `<p><strong style="color:#6366F1; font-size: 10pt;"><em>HD:</em></strong></p>`;
    body += `<p style="font-size: 10.5pt;">${processContentToHtml(w.example.solution, isLatexMode)}</p>`;
    body += `<p style="text-align:right; font-size: 10pt; margin-top: 4px;"><strong>ĐS: </strong>${processContentToHtml(formatMath(w.example.answer), isLatexMode)}</p>`;
    body += `</div>`;
    body += `</td>`;

    // Right Column
    body += `<td width="50%">`;
    body += `<p><strong style="color:#10B981">${idx + 1}b. Tự luyện:</strong></p>`;
    body += `<p>${processContentToHtml(w.practice.content, isLatexMode)}</p>`;
    body += `<div style="margin-top: 20px;">`;
    body += `<p style="color:#ccc; border-bottom:1px dotted #ccc;">&nbsp;</p>`;
    body += `<p style="color:#ccc; border-bottom:1px dotted #ccc;">&nbsp;</p>`;
    body += `<p style="color:#ccc; border-bottom:1px dotted #ccc;">&nbsp;</p>`;
    body += `</div>`;
    body += `<p style="text-align:right; margin-top:8px; font-size: 10pt;"><strong>ĐS: </strong>${processContentToHtml(formatMath(w.practice.answer), isLatexMode)}</p>`;
    body += `</td>`;

    body += `</tr>`;
  });
  body += `</table>`;

  if (reflectionQuestions.length > 0) {
    body += `<h2>CỦNG CỐ</h2>`;
    reflectionQuestions.forEach((q, idx) => {
      body += `<p><strong style="color:#6366F1">${idx+1}. </strong> ${processContentToHtml(q, isLatexMode)}</p>`;
    });
  }

  body += `<br/>`;
  body += `<table style="width: 50%; margin: 0 auto; font-size: 9pt;">`;
  body += `<tr><td style="background:#f3f4f6; text-align:center;"><b>Tự đánh giá</b></td><td style="text-align:center;">Tốt</td><td style="text-align:center;">Khá</td><td style="text-align:center;">Cần cố gắng</td></tr>`;
  body += `<tr><td>Hiểu bài</td><td style="text-align:center;">□</td><td style="text-align:center;">□</td><td style="text-align:center;">□</td></tr>`;
  body += `</table>`;

  if (homework.length > 0) {
      body += `<h2>BÀI TẬP VỀ NHÀ</h2>`;
      homework.forEach((hw, idx) => {
        const badge = hw.isRealWorld ? `[THỰC TẾ]` : `[${hw.bloomLevel}]`;
        body += `<div style="margin-bottom: 12px;">`;
        body += `<p><strong>B${idx+1} <span style="color:#8b5cf6">${badge}</span>: </strong> ${processContentToHtml(hw.content, isLatexMode)}</p>`;
        body += `</div>`;
      });
  }

  body += `<div style="margin-top:20px; text-align:center; font-size:9pt; color:#888; border-top:1px solid #ddd; padding-top:5px;">GV: Vũ Tiến Lực - THPT Nguyễn Hữu Cảnh</div>`;

  if (homework.length > 0) {
      body += `<br clear="all" style="page-break-before:always" />`;
      body += `<h1>HƯỚNG DẪN GIẢI CHI TIẾT BTVN</h1>`;
      
      homework.forEach((hw, idx) => {
          body += `<div class="problem-box">`;
          body += `<h3>Bài ${idx+1} [${hw.bloomLevel}]</h3>`;
          body += `<div class="solution-box">`;
          body += processContentToHtml(hw.solution, isLatexMode);
          body += `</div>`;
          body += `<p style="text-align:right; margin-top:5px;"><strong>Đáp số: </strong> ${processContentToHtml(hw.answer, isLatexMode)}</p>`;
          body += `</div>`;
      });
  }

  const suffix = isLatexMode ? '_latex.docx' : '_equation.docx';
  await saveHtmlAsDocx(body, `Phieu_Hoc_Tap_${topic.replace(/\s+/g, '_')}${suffix}`);
};

export const exportWorksheetForStudent = async (
  worksheet: WorksheetProblem[], 
  topic: string, 
  coreKnowledge: string[] = [],
  reflectionQuestions: string[] = [],
  homework: HomeworkProblem[] = []
) => {
  let body = "";

  body += `<h1>PHIẾU HỌC TẬP TOÁN HỌC</h1>`;
  body += `<p style="text-align:center; font-size: 14pt;"><strong>Chuyên đề: ${topic.toUpperCase()}</strong></p>`;
  body += `<p style="text-align:center; font-size: 12pt;">Họ và tên: ............................................................ Lớp: .....................</p>`;
  
  if (coreKnowledge.length > 0) {
    body += `<h2>KIẾN THỨC CẦN NHỚ</h2>`;
    body += `<ul>`;
    coreKnowledge.forEach(() => {
      body += `<li style="margin-bottom: 4pt;">..........................................................................................................................................</li>`;
    });
    body += `</ul>`;
  }

  body += `<table>`;
  body += `<tr>`;
  body += `<td class="header-cell" width="50%">HƯỚNG DẪN & VÍ DỤ MẪU</td>`;
  body += `<td class="header-cell-practice" width="50%">BÀI TẬP TỰ LUYỆN</td>`;
  body += `</tr>`;

  worksheet.forEach((w, idx) => {
    body += `<tr>`;
    
    // Left Column
    body += `<td width="50%">`;
    body += `<p><strong style="color:#2E74B5">${idx + 1}a. Ví dụ:</strong></p>`;
    body += `<p>${processContentToHtml(w.example.content, false)}</p>`;
    
    body += `<div style="margin-top: 4pt; border-top: 1px dotted #ccc; padding-top: 2pt;">`;
    body += `<p><strong style="color:#6366F1; font-size: 10pt;"><em>HD:</em></strong></p>`;
    body += `<p style="color:#ccc; border-bottom:1px dotted #ccc; margin-bottom: 6pt;">&nbsp;</p>`;
    body += `<p style="color:#ccc; border-bottom:1px dotted #ccc; margin-bottom: 6pt;">&nbsp;</p>`;
    body += `<p style="text-align:right; font-size: 10pt; margin-top: 2pt;"><strong>ĐS: </strong>${processContentToHtml(formatMath(w.example.answer), false)}</p>`;
    body += `</div>`;
    body += `</td>`;

    // Right Column
    body += `<td width="50%">`;
    body += `<p><strong style="color:#10B981">${idx + 1}b. Tương tự:</strong></p>`;
    body += `<p>${processContentToHtml(w.practice.content, false)}</p>`;
    body += `<div style="margin-top: 6pt;">`;
    body += `<p style="color:#ccc; border-bottom:1px dotted #ccc; margin-bottom: 6pt;">&nbsp;</p>`;
    body += `<p style="color:#ccc; border-bottom:1px dotted #ccc; margin-bottom: 6pt;">&nbsp;</p>`;
    body += `<p style="color:#ccc; border-bottom:1px dotted #ccc; margin-bottom: 6pt;">&nbsp;</p>`;
    body += `</div>`;
    body += `<p style="text-align:right; margin-top:4pt; font-size: 10pt;"><strong>ĐS: </strong>${processContentToHtml(formatMath(w.practice.answer), false)}</p>`;
    body += `</td>`;

    body += `</tr>`;
  });
  body += `</table>`;

  if (reflectionQuestions.length > 0) {
    body += `<h2>CỦNG CỐ</h2>`;
    reflectionQuestions.forEach((q, idx) => {
      body += `<p><strong style="color:#6366F1">${idx+1}. </strong> ${processContentToHtml(q, false)}</p>`;
    });
  }

  body += `<br/>`;
  body += `<table style="width: 50%; margin: 0 auto; font-size: 9pt;">`;
  body += `<tr><td style="background:#f3f4f6; text-align:center;"><b>Tự đánh giá</b></td><td style="text-align:center;">Tốt</td><td style="text-align:center;">Khá</td><td style="text-align:center;">Cần cố gắng</td></tr>`;
  body += `<tr><td>Hiểu bài</td><td style="text-align:center;">□</td><td style="text-align:center;">□</td><td style="text-align:center;">□</td></tr>`;
  body += `</table>`;

  if (homework.length > 0) {
      body += `<h2>BÀI TẬP VỀ NHÀ</h2>`;
      homework.forEach((hw, idx) => {
        const badge = hw.isRealWorld ? `[THỰC TẾ]` : `[${hw.bloomLevel}]`;
        body += `<div style="margin-bottom: 6pt;">`;
        body += `<p><strong>B${idx+1} <span style="color:#8b5cf6">${badge}</span>: </strong> ${processContentToHtml(hw.content, false)}</p>`;
        body += `</div>`;
      });
  }

  body += `<div style="margin-top:10px; text-align:center; font-size:9pt; color:#888; border-top:1px solid #ddd; padding-top:5px;">GV: Vũ Tiến Lực - THPT Nguyễn Hữu Cảnh</div>`;

  if (homework.length > 0) {
      body += `<br clear="all" style="page-break-before:always" />`;
      body += `<h1>HƯỚNG DẪN GIẢI CHI TIẾT BTVN</h1>`;
      
      homework.forEach((hw, idx) => {
          body += `<div class="problem-box">`;
          body += `<h3 style="margin: 2pt 0;">Bài ${idx+1} [${hw.bloomLevel}]</h3>`;
          body += `<div class="solution-box" style="margin-top: 2pt;">`;
          body += processContentToHtml(hw.solution, false);
          body += `</div>`;
          body += `<p style="text-align:right; margin-top:2pt;"><strong>Đáp số: </strong> ${processContentToHtml(hw.answer, false)}</p>`;
          body += `</div>`;
      });
  }

  await saveHtmlAsDocx(body, `Phieu_Hoc_Tap_Hoc_Sinh_${topic.replace(/\s+/g, '_')}.docx`, true);
};
