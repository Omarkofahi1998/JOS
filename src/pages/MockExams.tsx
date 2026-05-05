import { useState } from "react";
import { CheckCircle2, Clock, Search, ChevronDown, ShieldCheck } from "lucide-react";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  major: string;
  image?: string;
}

const ALL_QUESTIONS: Question[] = [
  // --- ثقافة عامة (Arabic) ---
  { id: 101, text: "تعتبر 'هيئة الخدمة والإدارة العامة' هي الخلف القانوني والواقعي لـ:", options: ["وزارة العمل", "ديوان الخدمة المدنية", "معهد الإدارة العامة", "وزارة تطوير القطاع العام"], correct: 1, major: "عام" },
  { id: 102, text: "كم مرة يتم انعقاد الدورة العادية لمجلس الأمة الأردني في السنة؟", options: ["مرة واحدة", "مرتين", "ثلاث مرات", "عند الحاجة فقط"], correct: 0, major: "عام" },
  { id: 103, text: "أي من التالية يعتبر من اختصاصات السلطة التنفيذية في الأردن؟", options: ["إصدار القوانين", "تعيين القضاة", "وضع السياسة العامة للدولة وتفيذها", "الفصل في المنازعات"], correct: 2, major: "عام" },
  { id: 104, text: "ما هي عاصمة الدولة الأموية؟", options: ["بغداد", "القاهرة", "دمشق", "المدينة المنورة"], correct: 2, major: "عام" },
  { id: 105, text: "من هو واضع علم العروض؟", options: ["الخليل بن أحمد الفراهيدي", "سيبويه", "أبو الأسود الدؤلي", "الجاحظ"], correct: 0, major: "عام" },
  { id: 106, text: "أين يقع مقر جامعة الدول العربية؟", options: ["الرياض", "عمان", "القاهرة", "تونس"], correct: 2, major: "عام" },
  { id: 107, text: "ما هو عدد محافظات المملكة الأردنية الهاشمية؟", options: ["10", "12", "14", "8"], correct: 1, major: "عام" },
  { id: 108, text: "من هو الملك الذي لُقب بـ 'الملك الباني' في الأردن؟", options: ["الملك عبد الله الأول", "الملك طلال", "الملك الحسين بن طلال", "الملك عبد الله الثاني"], correct: 2, major: "عام" },
  { id: 109, text: "ما هي أكبر قارة في العالم من حيث المساحة؟", options: ["أفريقيا", "آسيا", "أوروبا", "أمريكا الشمالية"], correct: 1, major: "عام" },
  { id: 110, text: "ما هو الرمز الكيميائي للماء؟", options: ["CO2", "O2", "H2O", "NaCl"], correct: 2, major: "عام" },

  // --- العلوم الطبية المخبرية (English) ---
  { id: 601, text: "Which enzyme is the most specific indicator for acute pancreatitis?", options: ["Amylase", "AST", "Lipase", "ALT"], correct: 2, major: "مختبرات" },
  { id: 602, text: "A patient's blood type is determined as 'O Negative'. This means their RBCs lack which antigens?", options: ["A and B only", "A, B, and Rh (D)", "Rh only", "None of the above"], correct: 1, major: "مختبرات" },
  { id: 603, text: "In Gram staining, what color do Gram-POSITIVE bacteria appear after the process?", options: ["Pink", "Red", "Colorless", "Purple/Blue"], correct: 3, major: "مختبرات" },
  { id: 604, text: "Identify the cell characterized by its biconcave shape and lack of a nucleus when mature.", options: ["Neutrophil", "Erythrocyte", "Lymphocyte", "Monocyte"], correct: 1, major: "مختبرات", image: "https://images.unsplash.com/photo-1579152276503-6862b7b75487?q=80&w=600&auto=format&fit=crop" },
  { id: 605, text: "What is the primary function of the buffer used in gel electrophoresis of DNA?", options: ["To stain the DNA", "To maintain constant pH and provide ions for current", "To separate the double strands", "To bind DNA to the gel matrix"], correct: 1, major: "مختبرات" },
  { id: 606, text: "Wait for the test results of a 'Cross-match'. If agglutination occurs in the major cross-match, the blood is:", options: ["Compatible", "Incompatible", "Universal donor", "Rh positive"], correct: 1, major: "مختبرات" },
  { id: 607, text: "The normal range for fasting blood glucose (FBG) in a healthy adult is:", options: ["70-99 mg/dL", "100-125 mg/dL", "126-140 mg/dL", "Above 140 mg/dL"], correct: 0, major: "مختبرات" },
  { id: 608, text: "What is the anticoagulant of choice for a Complete Blood Count (CBC) test?", options: ["Heparin", "Sodium Citrate", "EDTA", "Potassium Oxalate"], correct: 2, major: "مختبرات" },
  { id: 609, text: "In Clinical Chemistry, a 'Lipemic' serum sample appears:", options: ["Clear and straw-colored", "Yellow/Orange (Icteric)", "Milky or white", "Red (Hemolyzed)"], correct: 2, major: "مختبرات", image: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?q=80&w=600&auto=format&fit=crop" },
  { id: 610, text: "Which hormone is detected in maternal urine for pregnancy testing?", options: ["Estrogen", "Progesterone", "HCG", "LH"], correct: 2, major: "مختبرات" },
  { id: 611, text: "Wait for the test results. A 'shifted to the left' neutrophil count typically indicates:", options: ["Viral infection", "Bacterial infection", "Allergic reaction", "Parasitic infection"], correct: 1, major: "مختبرات" },
  { id: 612, text: "Which of the following is used to calibrate a spectrophotometer?", options: ["Normal saline", "Distilled water or reagent blank", "Patient serum", "Whole blood"], correct: 1, major: "مختبرات" },
  { id: 613, text: "Identify this crystal found during a microscopic urine analysis.", options: ["Calcium Oxalate", "Uric Acid", "Triple Phosphate", "Cystine"], correct: 0, major: "مختبرات", image: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Calcium_oxalate_crystals_in_urine.JPG" },
  { id: 614, text: "The 'Golden Standard' for diagnosing Diabetes Mellitus is:", options: ["Random Glucose", "Urine Glucose", "Oral Glucose Tolerance Test (OGTT)", "HbA1c"], correct: 3, major: "مختبرات" },
  { id: 615, text: "In Microbiology, 'Fastidious' organisms are those that:", options: ["Grow very fast", "Require specific complex nutrients to grow", "Are resistant to all antibiotics", "Only grow in anaerobic conditions"], correct: 1, major: "مختبرات" },
  { id: 616, text: "Which element is responsible for the red color of blood?", options: ["Magnesium", "Calcium", "Iron (Hemoglobin)", "Copper"], correct: 2, major: "مختبرات" },

  // --- تمريض (English) ---
  { id: 401, text: "Which site is most appropriate for assessing a pulse in an unresponsive adult?", options: ["Radial", "Brachial", "Carotid", "Femoral"], correct: 2, major: "تمريض" },
  { id: 402, text: "A patient has a blood pressure of 160/95 mmHg. This is classified as:", options: ["Normal", "Stage 1 Hypertension", "Stage 2 Hypertension", "Hypertensive Crisis"], correct: 2, major: "تمريض" },
  { id: 403, text: "The first step in basic life support (BLS) is to:", options: ["Perform chest compressions", "Give rescue breaths", "Check the scene for safety", "Call 911"], correct: 2, major: "تمريض" },
  { id: 404, text: "Which of the following is an early sign of hypoxia?", options: ["Cyanosis", "Restlessness", "Bradycardia", "Confusion"], correct: 1, major: "تمريض" },
  { id: 405, text: "Identify the ECG rhythm shown below.", options: ["Sinus Tachycardia", "Atrial Fibrillation", "Ventricular Fibrillation", "Normal Sinus Rhythm"], correct: 2, major: "تمريض", image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/V_fib_ecg.jpg" },
  { id: 406, text: "Which of the following is the standard position for a patient receiving an enema?", options: ["High Fowler's", "Prone", "Sims' (Left lateral)", "Lithotomy"], correct: 2, major: "تمريض" },
  { id: 407, text: "When performing catheterization, the most critical principle to follow is:", options: ["Patient comfort", "Proper documentation", "Sterile technique", "Speed of performance"], correct: 2, major: "تمريض" },
  { id: 408, text: "A patient is prescribed 500mg of a drug. The available dose is 250mg tablets. How many tablets should be given?", options: ["1 tablet", "1.5 tablets", "2 tablets", "3 tablets"], correct: 2, major: "تمريض" },
  { id: 409, text: "What is the priority nursing intervention for a patient experiencing an anaphylactic shock?", options: ["Administering IVF", "Auscultating lung sounds", "Administering Epinephrine", "Checking blood pressure"], correct: 2, major: "تمريض" },
  { id: 410, text: "Identify the anatomical landmarks for ventrogluteal IM injection.", options: ["Deltoid muscle", "Outer quadrant of the buttock", "Greater trochanter and iliac crest", "Anterior aspect of the thigh"], correct: 2, major: "تمريض" },
  { id: 411, text: "A nurse is caring for a patient with a chest tube. If the tube becomes disconnected, the FIRST action should be:", options: ["Call the doctor", "Clamp the tube", "Submerge the end in sterile water", "Apply a pressure dressing"], correct: 2, major: "تمريض" },
  { id: 412, text: "The proper angle for a SUB-CUTANEOUS (SC) injection in an average weight person is:", options: ["15 degrees", "45 degrees", "90 degrees", "Both 45 and 90 are acceptable depending on tissue"], correct: 3, major: "تمريض" },
  { id: 413, text: "Which of the following is a symptom of LEFT-sided heart failure?", options: ["Peripheral edema", "Jugular vein distension", "Crackles in the lungs", "Liver enlargement"], correct: 2, major: "تمريض" },
  { id: 414, text: "According to Maslow's Hierarchy of Needs, which is the priority?", options: ["Safety and Security", "Self-actualization", "Physiological needs (Air, Water)", "Love and Belonging"], correct: 2, major: "تمريض" },
  { id: 415, text: "The primary purpose of using 'Incentive Spirometry' after surgery is to prevent:", options: ["DVT", "Pressure sores", "Atelectasis (lung collapse)", "Nausea"], correct: 2, major: "تمريض" },

  // --- قانون (Arabic) ---
  { id: 701, text: "يعتبر القانون سارياً في المملكة الأردنية الهاشمية من تاريخ:", options: ["توقيع الملك عليه", "التصويت عليه في مجلس الأمة", "بعد مرور ثلاثين يوماً على نشره بالجريدة الرسمية ما لم ينص القانون على غير ذلك", "إقراره من مجلس الوزراء"], correct: 2, major: "قانون" },
  { id: 702, text: "ما هي المحكمة المختصة بالنظر في الطعون الانتخابية الخاصة بمجلس النواب؟", options: ["محكمة الاستئناف", "المحكمة الدستورية", "محكمة العدل العليا", "محكمة أمن الدولة"], correct: 0, major: "قانون" },
  { id: 703, text: "يعتبر الشخص ناقص الأهلية إذا كان عمره:", options: ["تحت سن العاشرة", "بين سن السابعة والثمانية عشر", "فوق الثمانية عشر", "تحت السابعة"], correct: 1, major: "قانون" },
  { id: 704, text: "ما هو المبدأ القانوني الذي يقضي بأنه لا عقوبة إلا بنص؟", options: ["مبدأ المساواة", "مبدأ شرعية الجرائم والعقوبات", "مبدأ التقادم", "مبدأ حق الدفاع"], correct: 1, major: "قانون" },
  { id: 705, text: "تعتبر عقوبة الإعدام في القانون الجنائي الأردني من:", options: ["الجنايات", "الجنح", "المخالفات", "الغرامات"], correct: 0, major: "قانون" },
  { id: 706, text: "ما هو الشرط الأساسي لقيام المسؤولية التقصيرية؟", options: ["الخطأ والضرر وعلاقة السببية", "وجود مصلحة", "توافق الإرادتين", "مرور الزمن"], correct: 0, major: "قانون" },
  { id: 707, text: "يعتبر الحق في العمل من الحقوق:", options: ["السياسية", "الاقتصادية والاجتماعية", "الشخصية المطلقة", "المدنية فقط"], correct: 1, major: "قانون" },
  { id: 708, text: "من هو الشخص الاعتباري في القانون؟", options: ["الإنسان فقط", "الشركات والجمعيات والدولة", "مجنون فاقد العقل", "الجنين في بطن أمه"], correct: 1, major: "قانون" },
  { id: 709, text: "يعتبر 'السكوت' في القانون تعبيراً عن الإرادة إذا:", options: ["كان القبول هو الأصل", "اقترن بظروف معينة (السكوت الملابس)", "في كل الأحوال", "لا يعتبر تعبيراً أبداً"], correct: 1, major: "قانون" },
  { id: 710, text: "أي من الجرائم التالية تعتبر جرائم 'سياسية' بطبيعتها؟", options: ["السرقة", "التجسس", "القتل العمد", "الرشوة"], correct: 1, major: "قانون" },
  { id: 711, text: "تنقضي الدعوى الجزائية في القانون الأردني بـ:", options: ["وفاة المتهم", "العفو العام", "التقادم", "كل ما ذكر صحيح"], correct: 3, major: "قانون" },
  { id: 712, text: "ما هو الحد الأعلى لعدد أعضاء مجلس النواب الأردني وفقاً لقانون الانتخاب الجديد؟", options: ["110 عضواً", "130 عضواً", "138 عضواً", "150 عضواً"], correct: 2, major: "قانون" },

  // --- معلم صف (Arabic) ---
  { id: 801, text: "تعتبر استراتيجية 'العصف الذهني' مفيدة جداً في تحفيز:", options: ["الحفظ والتلقين", "التفكير الإبداعي وحل المشكلات", "النظام الصفي الصارم", "العمل الفردي فقط"], correct: 1, major: "معلم_صف" },
  { id: 802, text: "أي من هؤلاء العلماء ارتبط اسمه بـ 'الاستقصاء التربوي'؟", options: ["بياجيه", "جون ديوي", "سكينر", "واطسون"], correct: 1, major: "معلم_صف" },
  { id: 803, text: "مفهوم 'النمذجة' في التعليم يعتمد بشكل أساسي على:", options: ["الاختبارات الورقية", "التعلم بالتقليد والملاحظة", "توزيع الجوائز", "إلقاء المحاضرات"], correct: 1, major: "معلم_صف" },
  { id: 804, text: "يقصد بـ 'التغذية الراجعة' في العملية التعليمية:", options: ["إطعام الطلاب", "تصويب أخطاء المتعلم وتوجيهه فوراً", "كتابة الواجب البيتي", "انتهاء الحصة الدراسية"], correct: 1, major: "معلم_صف" },
  { id: 805, text: "أي من الوسائل التالية تعتبر وسيلة تعليمية 'بصرية' فقط؟", options: ["الراديو", "الخرائط واللوحات", "الفيلم الناطق", "المختبر اللغوي"], correct: 1, major: "معلم_صف" },
  { id: 806, text: "يقصد بالتقييم 'التشخيصي' هو التقييم الذي يتم:", options: ["في نهاية العام", "في منتصف الفصل", "قبل البدء بالعملية التعليمية لتحديد نقاط القوة والضعف", "خلال الحصة الدراسية فقط"], correct: 2, major: "معلم_صف" },
  { id: 807, text: "تركز نظرية 'الذكاءات المتعددة' لغاردنر على أن:", options: ["الذكاء هو قدرة واحدة ثابتة", "الذكاء يتكون من قدرات مستقلة ومتنوعة", "الذكاء وراثي فقط", "الذكاء لا يمكن قياسه"], correct: 1, major: "معلم_صف" },
  { id: 808, text: "ما هو المكون الأساسي لـ 'بيئة التعلم الآمنة'؟", options: ["العقاب البدني", "الدعم النفسي والاجتماعي والاحترام المتبادل", "كثرة الواجبات البيئية", "الهدوء التام وعدم الحركة"], correct: 1, major: "معلم_صف" },
  { id: 809, text: "أي من هذه المهارات تعتبر 'مهارة حركية دقيقة' عند الطفل؟", options: ["الجري والقفز", "مسك القلم والرسم", "رمي الكرة", "الوقوف على قدم واحدة"], correct: 1, major: "معلم_صف" },
  { id: 810, text: "تعتبر 'التعلم باللعب' استراتيجية فعالة خاصة لطلبة:", options: ["الجامعات", "المراحل الأساسية الأولى", "الثانوية العامة", "كل ما ذكر صحيح"], correct: 1, major: "معلم_صف" },

  // --- IT (English) ---
  { id: 301, text: "Which protocol is used for encrypted remote login to a server?", options: ["Telnet", "SSH", "HTTP", "FTP"], correct: 1, major: "IT" },
  { id: 302, text: "In SQL, which command is used to add new data to a table?", options: ["ADD", "UPDATE", "INSERT INTO", "SAVE"], correct: 2, major: "IT" },
  { id: 303, text: "What is the primary function of a Router in a network?", options: ["Connecting devices in a LAN", "Connecting different networks and routing packets", "Storing web pages", "Acting as a Firewall"], correct: 1, major: "IT" },
  { id: 304, text: "Which of the following is NOT an Operating System?", options: ["Linux", "MySQL", "Windows", "MacOS"], correct: 1, major: "IT" },
  { id: 305, text: "Identify the logical gate shown in the truth table below (Output 1 only when both inputs are 1).", options: ["OR", "AND", "NOT", "XOR"], correct: 1, major: "IT" },
  { id: 306, text: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language", "Hyper Tool Multi Language"], correct: 0, major: "IT" },
  { id: 307, text: "In CSS, which property is used to change the background color?", options: ["color", "background-color", "bgcolor", "background-style"], correct: 1, major: "IT" },
  { id: 308, text: "Which of the following is a NO-SQL database?", options: ["PostgreSQL", "Oracle", "MongoDB", "MariaDB"], correct: 2, major: "IT" },
  { id: 309, text: "Which HTTP method is used to retrieve data from a server?", options: ["POST", "PUT", "DELETE", "GET"], correct: 3, major: "IT" },
  { id: 310, text: "What is the main purpose of DNS?", options: ["Digital Network Security", "Domain Name System (Mapping names to IPs)", "Direct Network Service", "Dynamic Node Server"], correct: 1, major: "IT" },
  { id: 311, text: "Which programming language is known as the 'mother of all languages'?", options: ["Java", "Python", "C", "Fortran"], correct: 2, major: "IT" },
  { id: 312, text: "What is the size of an IPv4 address?", options: ["32 bits", "64 bits", "128 bits", "16 bits"], correct: 0, major: "IT" },
  { id: 313, text: "Which of these is a front-end framework?", options: ["Express.js", "Django", "React.js", "Spring Boot"], correct: 2, major: "IT" },
  { id: 314, text: "What is the default port for HTTP?", options: ["443", "21", "80", "8080"], correct: 2, major: "IT" },
  { id: 315, text: "In JavaScript, what is the correct way to write an array?", options: ["var colors = 1 = ('red'), 2 = ('green')", "var colors = ['red', 'green', 'blue']", "var colors = 'red', 'green', 'blue'", "var colors = (1:'red', 2:'green')"], correct: 1, major: "IT" }
];

const MAJORS = [
  { id: "عام", name: "ثقافة عامة" },
  { id: "مختبرات", name: "العلوم الطبية المخبرية" },
  { id: "تمريض", name: "تمريض" },
  { id: "قانون", name: "قانون" },
  { id: "معلم_صف", name: "معلم صف" },
  { id: "IT", name: "تكنولوجيا المعلومات" }
];

export default function MockExams() {
  const [started, setStarted] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<string>("عام");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [majorSearch, setMajorSearch] = useState("");

  const selectMajor = (id: string) => {
    setSelectedMajor(id);
    setIsDropdownOpen(false);
  };

  const prepareExam = () => {
    let filtered = ALL_QUESTIONS.filter(q => q.major === selectedMajor).sort(() => 0.5 - Math.random()).slice(0, 15);
    if (filtered.length === 0) {
      filtered = ALL_QUESTIONS.filter(q => q.major === "عام").slice(0, 10);
    }
    
    // Store data for the detached window
    const examData = {
      questions: filtered,
      majors: [MAJORS.find(m => m.id === selectedMajor)?.name || selectedMajor],
      startTime: new Date().getTime()
    };
    localStorage.setItem("current_exam", JSON.stringify(examData));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-900 mx-auto mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">الامتحانات التجريبية التخصصية</h1>
        <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
          اختر التخصص الذي ترغب في التدرب عليه لبدء امتحان محاكاة يطابق نمط أسئلة هيئة الخدمة والإدارة العامة.
        </p>
      </div>

      <div className="max-w-xs mx-auto mb-12">
        <label className="block text-[10px] font-black text-slate-400 mb-2 mr-2 uppercase tracking-widest">اختر التخصص:</label>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 flex items-center justify-between shadow-sm hover:border-red-600 transition-all text-right"
          >
            <span className="text-sm font-bold text-slate-900">
              {MAJORS.find(m => m.id === selectedMajor)?.name}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform mr-2 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2.5 border-b border-slate-50 bg-slate-50/50">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث..."
                    className="w-full h-8 pr-8 pl-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-red-600 transition-all"
                    value={majorSearch}
                    onChange={(e) => setMajorSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {MAJORS.filter(m => m.name.includes(majorSearch)).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMajor(m.id)}
                    className={`w-full p-3 text-right hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0 ${
                      selectedMajor === m.id ? 'bg-red-50 text-red-600' : 'text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold">{m.name}</span>
                    {selectedMajor === m.id && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isDropdownOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-900/10 backdrop-blur-[2px]" onClick={() => setIsDropdownOpen(false)} />
      )}

      <div className="text-center">
        <div className="inline-flex flex-col items-center gap-6">
          <a
            href={`${window.location.origin}${window.location.pathname}#/exam`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={prepareExam}
            className="bg-slate-900 text-white px-20 py-6 rounded-[2rem] font-black text-2xl hover:bg-red-600 transition-all shadow-2xl shadow-slate-900/30 hover:-translate-y-2 group flex items-center gap-4 no-underline"
          >
            <ShieldCheck className="w-8 h-8 text-red-500 group-hover:text-white transition-colors" />
            الدخول الى الامتحان
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
               <ChevronDown className="w-5 h-5 -rotate-90" />
            </div>
          </a>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold bg-slate-50 px-6 py-3 rounded-full border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              سيتم بدء امتحان: {MAJORS.find(m => m.id === selectedMajor)?.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
