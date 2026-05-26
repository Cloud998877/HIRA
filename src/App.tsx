import React, { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Sparkles, 
  History, 
  HelpCircle, 
  FileCheck, 
  TrendingUp, 
  AlertCircle, 
  Trash2, 
  RotateCcw,
  CheckCircle,
  FileText
} from "lucide-react";
import ManualInputForm from "./components/ManualInputForm";
import SummaryTable from "./components/SummaryTable";
import { LiteratureSummary, SavedLiterature } from "./types";

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<"input" | "table" | "history" | "help">("input");

  // Form states
  const [seq, setSeq] = useState<number>(1);
  const [type, setType] = useState<string>("RCT");
  const [text, setText] = useState<string>("");
  const [extra, setExtra] = useState<string>("");

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active result states
  const [currentSummary, setCurrentSummary] = useState<LiteratureSummary | null>(null);
  const [activeSummarySeq, setActiveSummarySeq] = useState<number>(1);
  const [activeSummaryType, setActiveSummaryType] = useState<string>("RCT");

  // History state
  const [history, setHistory] = useState<SavedLiterature[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hira_literature_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
        // Automatically set the most recent summary as current if available
        if (parsed.length > 0) {
          setCurrentSummary(parsed[0].summary);
          setActiveSummarySeq(parsed[0].seq);
          setActiveSummaryType(parsed[0].type);
          setSeq(parsed[0].seq + 1); // Auto-increment sequence for next
          setActiveTab("table");
        }
      }
    } catch (err) {
      console.error("Local storage error:", err);
    }
  }, []);

  // Sync back history to local storage
  const saveHistory = (newHistory: SavedLiterature[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("hira_literature_history", JSON.stringify(newHistory));
    } catch (err) {
      console.error("Failed to write history:", err);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage("의학 문헌 내용을 붙여넣거나 샘플을 기재해 주십시오.");
      return;
    }

    // VITE_GEMINI_API_KEY: Vercel 환경변수에서 가져옴 (브라우저 직접 호출 — 서버 타임아웃 없음)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
    if (!apiKey) {
      setErrorMessage(
        "API 키가 설정되지 않았습니다.\n" +
        "Vercel 프로젝트 설정 > Environment Variables 에서\n" +
        "VITE_GEMINI_API_KEY = (발급받은 Gemini API 키) 를 추가하고 재배포해 주세요."
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setLoadingStep("Gemini AI와 연결 중...");

    const SYSTEM_INSTRUCTION = `당신은 대한민국 건강보험심사평가원(심평원) 제출용 임상시험 문헌 요약표(표6) 전문 작성가입니다.

[필수 작성 원칙]
1. 모든 문장 어미는 반드시 "~임.", "~함.", "~확인됨.", "~나타남." 등 명사형 격식체로 끝낼 것
2. 통계 수치(HR, 95% CI, p-value, OR)는 절대 생략 없이 완전한 세트로 기재
3. 포함·제외 기준은 번호 목록으로 수치 포함하여 전부 기재
4. 안전성: 본문에서 강조된 주요 이상반응 5~7개만 시험군·대조군 비교 서술
5. 핵심 통계치는 **볼드** 처리
6. 줄글 금지 — 모든 항목은 "- 항목: 내용(~임)." 리스트 형식
7. 번역투 금지`;

    const userPrompt = `다음 임상문헌을 분석하여 심평원 표6 서식에 맞게 아래 JSON 형식으로 작성하세요.
코드블록(\`\`\`) 없이 순수 JSON만 반환하세요.

[기본정보] 연번: ${seq} / 문헌구분: ${type} / 추가요청: ${extra || "없음"}

[논문내용]
${text.slice(0, 7000)}

아래 JSON 키를 모두 채워서 반환:
{
  "title": "영문 제목 (한글 번역 병기)",
  "citation": "저자명 et al. 저널명. 연도;권(호):페이지",
  "countries": "참여 국가 목록 (쉼표 구분)",
  "authors": "주저자 et al.",
  "affiliation": "교신저자 소속기관 (영문+한글)",
  "objective": "연구 목적 (~함. 종결 리스트)",
  "inclusion": "1) 포함기준 항목: 수치 포함 내용임.\\n2) ...",
  "exclusion": "1) 제외기준 항목: 수치 포함 내용임.\\n2) ...",
  "studyPeriod": "○ 등록 기간: YYYY.MM~YYYY.MM임.\\n○ 추적관찰 기간(중앙값): N개월임.\\n○ 자료수집완료일: YYYY.MM.DD임.",
  "studyDesign": "- 설계 특성: 내용임.\\n- 무작위배정 방법: 내용임.\\n- 층화 기준: 내용임.",
  "intervention": "- 시험군 약물: 용량·경로·주기 포함 상세 내용임.",
  "control": "- 대조군 약물: 용량·경로·주기 포함 상세 내용임.",
  "primaryEndpoint": "- 1차 평가변수: 정의 및 측정방법 (~으로 정의됨.)",
  "secondaryEndpoints": "1) 2차 평가변수명: 정의 및 목적임.\\n2) ...",
  "patientCharacteristics": "- **중위 연령**: 시험군 N세, 대조군 N세로 균형 있게 배정됨.\\n- **성별 분포**: ...임.\\n- **ECOG 점수**: ...임.",
  "dropout": "- **등록 및 배정**: 총 N명 스크리닝 중 N명 무작위배정됨.\\n- **시험군 탈락**: N명 중도탈락, 주요 사유: ...임.\\n- **대조군 탈락**: ...임.",
  "results": "○ 유효성 결과\\n- **1차 평가변수**: 시험군 N% vs 대조군 N% (**OR/HR N.NN, 95% CI N.NN~N.NN, p=N.NNNN**)임.\\n\\n○ 안전성 결과\\n- **가장 흔한 3등급 이상**: 시험군 N% vs 대조군 N%임.",
  "conclusion": "- **주요 결론**: ...인 것으로 확인됨.",
  "limitations": "- **한계 1**: ...이 한계임.",
  "sponsor": "- **후원**: ...에서 후원함.",
  "sensitivityAnalysis": "해당 정보 없음",
  "researcherPerspective": "해당 정보 없음"
}`;

    try {
      // 브라우저에서 Gemini 스트리밍 API 직접 호출 (타임아웃 없음)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson?.error?.message || `Gemini API 오류 (${response.status})`;
        if (response.status === 400 || response.status === 403) {
          throw new Error(`API 키 오류: ${msg}\nVercel 환경변수 VITE_GEMINI_API_KEY 값을 확인해 주세요.`);
        }
        throw new Error(msg);
      }

      if (!response.body) throw new Error("스트리밍 응답을 받지 못했습니다.");

      // SSE 스트림을 읽으면서 텍스트 누적
      const reader = response.body.getReader();
      const dec = new TextDecoder();
      let accumulated = "";
      let buf = "";
      let charCount = 0;
      const steps = [
        "영문 의학 문헌 해독 중...",
        "포함·제외 기준 추출 중...",
        "통계치(HR, CI, p-value) 대조 중...",
        "이상반응 국문 교정 중...",
        "심평원 표6 서식 맵핑 중...",
      ];
      let stepIdx = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (chunk) {
              accumulated += chunk;
              charCount += chunk.length;
              if (charCount > stepIdx * 500 && stepIdx < steps.length) {
                setLoadingStep(steps[stepIdx++]);
              }
            }
          } catch { /* 불완전 청크 무시 */ }
        }
      }

      if (!accumulated.trim()) throw new Error("AI 응답이 비어있습니다. 잠시 후 다시 시도해 주세요.");

      // JSON 블록 추출 및 파싱
      let jsonStr = accumulated.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      const s = jsonStr.indexOf("{");
      const e = jsonStr.lastIndexOf("}");
      if (s !== -1 && e !== -1) jsonStr = jsonStr.slice(s, e + 1);

      let summaryResult: LiteratureSummary;
      try {
        summaryResult = JSON.parse(jsonStr);
      } catch {
        throw new Error("AI 응답을 JSON으로 파싱하지 못했습니다. 다시 시도해 주세요.");
      }

      setCurrentSummary(summaryResult);
      setActiveSummarySeq(seq);
      setActiveSummaryType(type);

      const newSavedItem: SavedLiterature = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 9),
        seq,
        type,
        uploadedAt: new Date().toLocaleString("ko-KR"),
        inputText: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
        summary: summaryResult,
      };
      const updatedHistory = [newSavedItem, ...history.filter(h => h.summary.title !== summaryResult.title)];
      saveHistory(updatedHistory);

      setActiveTab("table");
      setSeq(prev => prev + 1);

    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "문헌 가공 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

    const handleDownloadHTML = () => {
    if (!currentSummary) return;
    
    const tableHtml = document.getElementById("hira-submission-table")?.outerHTML || "";
    const titleClean = currentSummary.title.replace(/[^a-zA-Z0-9가-힣\s]/g, "").slice(0, 30).trim();
    
    // Self-contained high quality template for client hand-off
    const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>HIRA 표6 제출용 요약표 - ${titleClean}</title>
  <style>
    body {
      font-family: 'Malgun Gothic', '맑은 고딕', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #f7fafc;
      padding: 40px 20px;
      color: #2d3748;
    }
    .wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1);
    }
    .print-btn {
      display: inline-block;
      margin-bottom: 20px;
      background: #1A365D;
      color: white;
      padding: 10px 18px;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      text-decoration: none;
      font-size: 13px;
    }
    .print-btn:hover { background: #2B6CB0; }
    @media print {
      .print-btn { display: none; }
      body { background: white; padding: 0; }
      .wrapper { box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <button onclick="window.print()" class="print-btn">🖨️ 인쇄 / PDF 다운로드</button>
    ${tableHtml}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `표6_요약표_연번_${activeSummarySeq}_${titleClean || "HIRA"}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const loadFromHistory = (item: SavedLiterature) => {
    setCurrentSummary(item.summary);
    setActiveSummarySeq(item.seq);
    setActiveSummaryType(item.type);
    setActiveTab("table");
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("정말로 이 기록을 삭제하시겠습니까?")) {
      const updated = history.filter(h => h.id !== id);
      saveHistory(updated);
      if (updated.length === 0) {
        setCurrentSummary(null);
      } else if (currentSummary && !updated.find(u => u.summary.title === currentSummary.title)) {
        setCurrentSummary(updated[0].summary);
        setActiveSummarySeq(updated[0].seq);
        setActiveSummaryType(updated[0].type);
      }
    }
  };

  const clearAllHistory = () => {
    if (window.confirm("저장된 모든 문헌 분석 기록이 삭제됩니다. 계속하시겠습니까?")) {
      saveHistory([]);
      setCurrentSummary(null);
    }
  };

  const resetForm = () => {
    if (window.confirm("입력 중인 내용을 초기화하시겠습니까?")) {
      setText("");
      setExtra("");
      setSeq(history.length > 0 ? history[0].seq + 1 : 1);
      setErrorMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 print:bg-white print:p-0">
      
      {/* Upper Brand Bar (Invisible in print mode) */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 print:hidden select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl text-white shadow-inner">
                <ClipboardList className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight">
                    HIRA-GPT 심평원 제출용 임상문헌 자동 요약기
                  </h1>
                  <span className="bg-blue-800/60 text-[10px] text-blue-200 border border-blue-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    v3.5 Build
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  어지러운 영문 임상 보고서 및 3상 논문을 건강보험심사평가원 <strong className="text-slate-200">표6 서식(제출문헌 요약표)</strong>에 맞춰 100% 한글 의학 용어로 가공합니다.
                </p>
              </div>
            </div>
            
            {/* HIRA Stats Info Badges */}
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <div className="bg-slate-850 px-3 py-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-green-400" />
                <span>표6 자동 완결</span>
              </div>
              <div className="bg-slate-850 px-3 py-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span>P-value & HR 추출 특화</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Layout Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        
        {/* Navigation Tabs (Invisible in print mode) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-6 gap-3 print:hidden">
          <div className="flex bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("input")}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "input"
                  ? "bg-white text-blue-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>① 문헌 업로드 및 데이터 기재</span>
            </button>
            <button
              onClick={() => {
                if (!currentSummary) {
                  alert("생성 완료된 요약표가 없습니다. 논문을 기재해 분석을 마친 후 확인해 주세요.");
                  return;
                }
                setActiveTab("table");
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "table"
                  ? "bg-white text-blue-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              } ${!currentSummary ? "opacity-50" : ""}`}
            >
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>② 완성된 심평원 요약표 결과</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-white text-blue-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5 text-purple-600" />
              <span>③ 내 분석 히스토리 ({history.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("help")}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "help"
                  ? "bg-white text-blue-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>작성 가이드</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "input" && text.trim() && (
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-700 bg-white hover:bg-red-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-red-200 transition-colors cursor-pointer font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>입력 초기화</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Error Display (Invisible in print mode) */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 print:hidden shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 animate-bounce" />
            <div className="space-y-1">
              <span className="font-bold block">분석 작업 실패</span>
              <p className="text-xs text-red-700/90 whitespace-pre-wrap leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* 1. INPUT TAB */}
        {activeTab === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
            
            {/* Guide Info Left Column */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Informational Widget */}
              <div className="bg-gradient-to-b from-blue-950 to-slate-900 text-white rounded-2xl p-6 border border-blue-900 shadow-md">
                <h3 className="text-sm font-extrabold tracking-wide text-blue-200 uppercase mb-3">
                  💡 표6 중요 작성 수칙 안내
                </h3>
                <ul className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">1.</span>
                    <span><strong>명확성 원칙:</strong> 논문상의 수치(특히 Hazard Ratio, 95% CI, p-value)는 변경 없이 그대로 기입해야 합니다.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">2.</span>
                    <span><strong>이상반응 세분화:</strong> 일반 부작용과 Grade 3/4 이상 부작용을 성실히 비교 분기하여 서술해야 반려를 줄입니다.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">3.</span>
                    <span><strong>탈락자 기재:</strong> RCT의 무작위 배정 인원 수 대비 최종 가감 사유(부작용 탈락 등)를 상세히 제시해야 신뢰도가 높습니다.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">4.</span>
                    <span>영어로 복사해 부착하면, 기계 전문 번역 및 식약처 공인 국문 명칭 맵퍼가 실행되어 매우 정확도가 뛰어납니다.</span>
                  </li>
                </ul>
              </div>

              {/* Mini History Preview */}
              {history.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest mb-3.5 flex items-center justify-between">
                    <span>최근 가공된 임상 논문 ({Math.min(history.length, 3)})</span>
                    <button 
                      onClick={() => setActiveTab("history")}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      전체보기
                    </button>
                  </h4>
                  <div className="space-y-3">
                    {history.slice(0, 3).map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="group p-3 border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-55 rounded-lg cursor-pointer transition-all flex items-start gap-2 text-left"
                      >
                        <FileText className="w-4 h-4 shrink-0 text-slate-400 mt-0.5 group-hover:text-blue-600 transition-colors" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-900">
                            {item.summary.title}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            연번 {item.seq} · {item.type} · {item.uploadedAt.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Manual Form Entry Right Column */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                  <span className="w-2.5 h-2.5 bg-blue-700 rounded-full animate-ping" />
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                    분석 데이터 일괄 입력 전송
                  </h2>
                </div>

                <ManualInputForm
                  seq={seq}
                  setSeq={setSeq}
                  type={type}
                  setType={setType}
                  text={text}
                  setText={setText}
                  extra={extra}
                  setExtra={setExtra}
                  onSubmit={handleGenerate}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. SUMMARY TABLE TAB */}
        {activeTab === "table" && (
          <div className="space-y-6">
            {currentSummary ? (
              <SummaryTable
                seq={activeSummarySeq}
                type={activeSummaryType}
                summary={currentSummary}
                onDownloadHTML={handleDownloadHTML}
                onPrint={handlePrint}
              />
            ) : (
              <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 max-w-lg mx-auto shadow-sm">
                <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="font-bold text-slate-700">생성된 요약표가 없습니다</h4>
                <p className="text-xs mt-1 text-slate-500">
                  첫 번째 탭에서 논문을 기재한 뒤 자동 생성을 클릭해 주세요.
                </p>
                <button
                  onClick={() => setActiveTab("input")}
                  className="mt-4 inline-flex text-xs font-bold text-white bg-blue-900 px-4 py-2 rounded-lg"
                >
                  논문 분석하러 가기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. HISTORY TAB */}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto space-y-6 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  나의 로컬 분석 히스토리
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  이 브라우저의 저장소(localStorage)에 보관된 임상시험 요약 데이터 보관함입니다.
                </p>
              </div>
              
              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>내역 전체 비우기</span>
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-all cursor-pointer flex items-start justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                          연번 {item.seq}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.uploadedAt}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-blue-900 leading-snug line-clamp-1">
                        {item.summary.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono line-clamp-1">
                        {item.summary.citation}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-center shrink-0">
                      <span className="text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        불러오기 &rarr;
                      </span>
                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-1 px-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded"
                        title="이 기록 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border text-center p-14 rounded-2xl text-slate-400">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800">최근 보관 내역이 비어 있습니다</h4>
                <p className="text-xs mt-1 text-slate-505">
                  입력란에서 임상 논문을 처음 가공하면 여기에 히스토리가 누적 저장됩니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. HELP/GUIDE TAB */}
        {activeTab === "help" && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 print:hidden shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              📖 심평원 임상 문헌 요약표 (표6) 완벽 지침서
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-105">
                <h4 className="text-xs font-extrabold text-blue-950 uppercase tracking-widest mb-1.5">
                  1. 내용 구분 기준
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  임상 신청 신약 혹은 비급여 한도 확대 대상 등의 논문은 그 디자인에 따라 <strong>RCT (무작위배정 다기관 삼상)</strong>, <strong>코호트 연구</strong>, 혹은 <strong>단일군(Single arm)</strong> 등으로 상세히 체크해야 합니다. 잘못 선정 시 심사 과정이 지체될 소지가 있습니다.
                </p>
              </div>

              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-150">
                <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-widest mb-1.5">
                  2. 환자 특성 및 생존 연장 데이터 양군 분기법
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  HIRA 심사위원단은 <strong>기저 조건(Age, ECOG Score, 병기, 예후 유전자)</strong>이 양 군에 편향 없이 골고루 매칭되었는지 아주 엄밀하게 확인합니다. 저희 AI 엔진은 양군의 데이터를 추출해 각각 한눈에 보이게 표에 배정하기 때문에 신뢰를 제공합니다.
                </p>
              </div>

              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-1.5">
                  3. Word / 한컴 호환 카피앤패스트 보장
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  완성 탭에서 <strong className="text-slate-900">[클립보드 복사]</strong> 버튼을 누르면 스타일 속성 시트가 원형 보존된 채 복사되므로, 사용하시는 MS Word 나 한글(HWP, 한컴) 등의 프로그램에 그대로 <kbd className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Ctrl + V</kbd>를 누를 시 고해상도 가독성을 유지하며 표가 삽입됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Running Full-Screen Backdrop Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-subtle z-50 flex flex-col items-center justify-center text-white select-none p-4">
          <div className="relative mb-5 flex items-center justify-center">
            {/* Elegant double ring spinning loader */}
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute w-10 h-10 border-4 border-indigo-400/20 border-b-indigo-400 rounded-full animate-spin-reverse" />
          </div>
          
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI 전문가가 임상문헌을 해독 및 정밀 가공 중...</span>
          </h3>
          
          <p className="text-xs text-slate-400 mt-2 text-center max-w-sm font-medium animate-pulse">
            {loadingStep || "인공지능 정합성 체크 엔진 구동 중..."}
          </p>
          <span className="text-[10px] text-slate-500 mt-4 text-center">
            전문의학 지식 기저 기반으로 심평원 표6 완결성 검정을 실시하는 도중이므로 다소 시간이 소요될 수 있습니다. (대략 10초~20초)
          </span>
        </div>
      )}

      {/* Minimal Footer (Invisible in print mode) */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500 print:hidden select-none">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-600">
            🏥 심평원 표 제출논문 요약표 전문 AI 보조 생성 서비스
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            인공지능의 분석 결과는 정교하나, 실제 약제 청구 혹은 신의료기술 평가 신청 시 제출 전 반드시 원본 문헌의 수치를 최종 대조하여 증명해 주시기 바랍니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
