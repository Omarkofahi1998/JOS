export interface NormalizedQuestion {
  text: string;
  options: string[];
  correct: number;
  major: string;
  explanation: string;
  image_url: string;
}

/**
 * Normalizes question inputs from various JSON formats, plain text, or lenient key names.
 */
export function parseQuestionsInput(rawInput: string | any[]): NormalizedQuestion[] {
  let items: any[] = [];

  if (Array.isArray(rawInput)) {
    items = rawInput;
  } else if (typeof rawInput === 'string') {
    let cleanText = rawInput.trim();

    // 1. Remove markdown code fences if present
    cleanText = cleanText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

    // 2. Fix smart quotes / curly quotes
    cleanText = cleanText
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");

    // 3. Fix trailing commas before closing brackets or braces
    cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');

    // Attempt JSON parse
    try {
      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.questions)) items = parsed.questions;
        else if (Array.isArray(parsed.data)) items = parsed.data;
        else if (Array.isArray(parsed.items)) items = parsed.items;
        else items = [parsed];
      }
    } catch (jsonErr) {
      // If JSON parse failed, try line-by-line / plain text parsing fallback
      const textParsed = parsePlainTextQuestions(cleanText);
      if (textParsed.length > 0) {
        items = textParsed;
      } else {
        throw new Error("خطأ في تنسيق JSON. تأكد من أن النص يحتوي على مصفوفة JSON صحيحة أو أسئلة مرقمة مع خياراتها.");
      }
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("لم يتم العثور على أي أسئلة في النص المدخل.");
  }

  // Normalize each item
  const validQuestions: NormalizedQuestion[] = [];

  items.forEach((q, idx) => {
    if (!q || typeof q !== 'object') {
      throw new Error(`السؤال رقم ${idx + 1} ليس تنسيقاً صحيحاً.`);
    }

    // 1. Text
    const text = q.text || q.question || q.question_text || q.title || q.qText || q["السؤال"] || q["نص_السؤال"] || q["نص"] || "";
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error(`السؤال رقم ${idx + 1} ينقصه نص السؤال (احرص على وجود مفتاح "text" أو "السؤال").`);
    }

    // 2. Options
    let rawOptions = q.options || q.choices || q.answers || q["الخيارات"] || q["خيارات"] || q["الاجابات"] || q["الإجابات"] || [];
    let optionsArray: string[] = [];

    if (Array.isArray(rawOptions)) {
      optionsArray = rawOptions.map(opt => String(opt).trim()).filter(Boolean);
    } else if (rawOptions && typeof rawOptions === 'object') {
      optionsArray = Object.values(rawOptions).map(opt => String(opt).trim()).filter(Boolean);
    } else if (typeof rawOptions === 'string') {
      optionsArray = rawOptions.split(/\n|,|;/).map(opt => opt.trim()).filter(Boolean);
    }

    if (optionsArray.length < 2) {
      throw new Error(`السؤال رقم ${idx + 1} ("${text.slice(0, 25)}...") يحتاج خيارين على الأقل.`);
    }

    // 3. Major
    const major = q.major || q.subject || q.category || q.specialty || q["المادة"] || q["التخصص"] || "عام";

    // 4. Correct answer index
    const rawCorrect = q.correct ?? q.correctIndex ?? q.correct_index ?? q.answer ?? q.correct_answer ?? q["الإجابة"] ?? q["الإجابة_الصحيحة"] ?? q["الاجابة"] ?? q["الحل"] ?? 0;

    let correctIndex = 0;

    if (typeof rawCorrect === 'number') {
      correctIndex = rawCorrect;
      // If user provided 1-based index (1 to N) instead of 0-based
      if (correctIndex >= 1 && correctIndex <= optionsArray.length) {
        correctIndex = correctIndex - 1;
      }
    } else if (typeof rawCorrect === 'string') {
      const trimmed = rawCorrect.trim();
      const num = parseInt(trimmed, 10);

      if (!isNaN(num) && String(num) === trimmed) {
        correctIndex = (num >= 1 && num <= optionsArray.length) ? num - 1 : num;
      } else {
        const letterMap: Record<string, number> = {
          "أ": 0, "ا": 0, "a": 0, "A": 0, "1": 0,
          "ب": 1, "b": 1, "B": 1, "2": 1,
          "ج": 2, "c": 2, "C": 2, "3": 2,
          "د": 3, "d": 3, "D": 3, "4": 3,
        };

        const cleanLetter = trimmed.replace(/[.)\]\s]/g, '');
        if (cleanLetter in letterMap) {
          correctIndex = letterMap[cleanLetter];
        } else {
          const foundIdx = optionsArray.findIndex(opt => 
            opt.toLowerCase() === trimmed.toLowerCase() || 
            opt.includes(trimmed) || 
            trimmed.includes(opt)
          );
          correctIndex = foundIdx >= 0 ? foundIdx : 0;
        }
      }
    }

    if (correctIndex < 0 || correctIndex >= optionsArray.length) {
      correctIndex = 0;
    }

    // 5. Explanation
    const explanation = q.explanation || q.reason || q.comment || q["الشرح"] || q["توضيح"] || q["التفسير"] || "";

    // 6. Image URL
    const image_url = q.image_url || q.image || q.imageUrl || q.img_url || q["صورة"] || q["رابط_الصورة"] || "";

    validQuestions.push({
      text: text.trim(),
      options: optionsArray,
      correct: correctIndex,
      major: String(major).trim() || "عام",
      explanation: String(explanation).trim(),
      image_url: String(image_url).trim()
    });
  });

  return validQuestions;
}

function parsePlainTextQuestions(text: string): NormalizedQuestion[] {
  const questions: NormalizedQuestion[] = [];
  const blocks = text.split(/(?=\n\s*(?:[0-9]+[\.\)-]|س\s*[0-9]+[\.\:-]?|سؤال\s*[0-9]+))/gi).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    let qText = lines[0].replace(/^(?:[0-9]+[\.\)-]|س\s*[0-9]+[\.\:-]?|سؤال\s*[0-9]+)\s*/i, '');
    const options: string[] = [];
    let correct = 0;
    let explanation = "";

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^(?:إجابة|الحل|الاجابة|الإجابة|correct|answer)\s*[:\-]/i.test(line)) {
        const ansStr = line.replace(/^(?:إجابة|الحل|الاجابة|الإجابة|correct|answer)\s*[:\-]/i, '').trim();
        if (/^[أa1]/i.test(ansStr)) correct = 0;
        else if (/^[بb2]/i.test(ansStr)) correct = 1;
        else if (/^[جc3]/i.test(ansStr)) correct = 2;
        else if (/^[دd4]/i.test(ansStr)) correct = 3;
        continue;
      }
      if (/^(?:شرح|تفسير|الشرح|explanation)\s*[:\-]/i.test(line)) {
        explanation = line.replace(/^(?:شرح|تفسير|الشرح|explanation)\s*[:\-]/i, '').trim();
        continue;
      }
      const cleanOpt = line.replace(/^(?:[أبجدa-da-d1-4][\.\)-])\s*/i, '');
      options.push(cleanOpt);
    }

    if (qText && options.length >= 2) {
      questions.push({
        text: qText,
        options,
        correct,
        explanation,
        major: "عام",
        image_url: ""
      });
    }
  }

  return questions;
}
