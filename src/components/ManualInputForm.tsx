import React, { useRef } from "react";
import { Upload, FileText, AlertCircle, Sparkles, BookOpen, Plus, X } from "lucide-react";
import { SAMPLE_PAPERS, SamplePaper } from "./SamplePapers";

interface ManualInputFormProps {
  seq: number;
  setSeq: (s: number) => void;
  type: string;
  setType: (t: string) => void;
  text: string;
  setText: (t: string) => void;
  extra: string;
  setExtra: (e: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

interface AttachedFile {
  name: string;
  label: string; // "본문" | "부록" | "보충자료"
  content: string;
  size: number;
}

export default function ManualInputForm({
  seq, setSeq, type, setType, text, setText, extra, setExtra, onSubmit, loading,
}: ManualInputFormProps) {
  const mainFileRef  = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<AttachedFile[]>([]);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  // ── PDF.js 텍스트 추출 ─────────────────────────────────────────────
  const extractTextFromPDF = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function () {
        try {
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) { reject(new Error("PDF.js 미로드")); return; }
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

          const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(this.result as ArrayBuffer) }).promise;
          const pageLimit = Math.min(pdf.numPages, 80); // 부록 포함 최대 80페이지
          let fullText = "";

          for (let i = 1; i <= pageLimit; i++) {
            const page = await pdf.getPage(i);
            const tc = await page.getTextContent();
            let lastY = -1, pageText = "";
            for (const item of tc.items as any[]) {
              if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) pageText += "\n";
              pageText += item.str + " ";
              lastY = item.transform[5];
            }
            fullText += `\n--- PAGE ${i} ---\n` + pageText;
          }
          resolve(fullText);
        } catch (e: any) { reject(e); }
      };
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.readAsArrayBuffer(file);
    });
  };

  // ── 파일 처리 공통 ─────────────────────────────────────────────────
  const processFile = async (file: File, label: string) => {
    setFileError(null);
    const isPDF = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    const isTXT = file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain";
    if (!isPDF && !isTXT) {
      setFileError("PDF 또는 TXT 파일만 지원합니다.");
      return;
    }

    // 이미 같은 라벨 있으면 교체
    setFiles(prev => prev.filter(f => f.label !== label).concat({
      name: file.name, label, content: "(추출 중...)", size: file.size,
    }));

    try {
      let content = "";
      if (isPDF) {
        content = await extractTextFromPDF(file);
      } else {
        content = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = e => res(e.target?.result as string);
          r.onerror = rej;
          r.readAsText(file, "UTF-8");
        });
      }

      if (!content.trim() || content.trim().length < 50) {
        throw new Error("추출된 텍스트가 너무 짧습니다. 스캔 PDF이거나 텍스트 레이어가 없을 수 있습니다.");
      }

      setFiles(prev => {
        const updated = prev.map(f =>
          f.label === label ? { ...f, name: file.name, content, size: file.size } : f
        );
        // 전체 텍스트 합산 업데이트
        syncTextFromFiles(updated);
        return updated;
      });
    } catch (e: any) {
      setFiles(prev => prev.filter(f => f.label !== label));
      setFileError(`[${label}] 추출 실패: ${e.message}\n텍스트를 직접 붙여넣기 하거나 TXT 파일을 사용해 주세요.`);
    }
  };

  const syncTextFromFiles = (updatedFiles: AttachedFile[]) => {
    const combined = updatedFiles
      .map(f => `\n\n${"=".repeat(60)}\n[${f.label.toUpperCase()}] ${f.name}\n${"=".repeat(60)}\n${f.content}`)
      .join("");
    setText(combined);
  };

  const removeFile = (label: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.label !== label);
      if (updated.length === 0) setText("");
      else syncTextFromFiles(updated);
      return updated;
    });
  };

  // ── 드래그 & 드롭 (본문) ───────────────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file, "본문");
  };

  const loadPreset = (preset: SamplePaper) => {
    setFiles([{ name: `[샘플] ${preset.title}`, label: "본문", content: preset.text, size: 0 }]);
    setText(preset.text);
    setType(preset.type);
  };

  const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);

  return (
    <div className="space-y-6">
      {/* 샘플 논문 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
          <BookOpen className="w-4 h-4 text-blue-700" />
          <span>신속 체험을 위한 최신 3상 임상 논문 샘플</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          심평원(HIRA) 제출 빈도가 대단히 높은 최신 항암 신약 타깃 임상 문헌 데이터셋입니다.
          클릭 한 번으로 원문을 자동 로드하여 AI의 고순도 요약 능력을 곧바로 테스트해볼 수 있습니다.
        </p>
        <div className="grid grid-cols-2 gap-3.5">
          {SAMPLE_PAPERS.map((paper) => (
            <button key={paper.id} onClick={() => loadPreset(paper)}
              className="text-left bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl p-4 cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 group">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">{paper.type}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-medium transition-colors">불러오기 →</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1 group-hover:text-blue-900">{paper.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{paper.shortDesc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 연번 & 구분 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">연번 (No.)</label>
          <input type="number" min={1} value={seq} onChange={e => setSeq(Number(e.target.value) || 1)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-blue-600" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">제출 문헌 형태 분류</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-blue-600 cursor-pointer">
            <option value="RCT">Randomized controlled trial (RCT) - 무작위배정 대조 임상시험</option>
            <option value="cohort">Case-control or cohort studies - 환자대조군 또는 코호트 연구</option>
            <option value="single">Single arm study - 단일군 비대조 임상연구</option>
            <option value="case">Case report or case series - 증례보고 또는 증례군의 연구</option>
            <option value="other">기타</option>
          </select>
        </div>
      </div>

      {/* ── 파일 업로드 영역 ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            📎 문헌 파일 업로드 (본문 + 부록 동시 분석 가능)
          </label>
          <span className="text-[11px] text-slate-400">PDF / TXT 지원</span>
        </div>

        {/* 업로드된 파일 목록 */}
        {files.length > 0 && (
          <div className="mb-3 space-y-2">
            {files.map(f => (
              <div key={f.label} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded shrink-0">{f.label}</span>
                <span className="text-xs text-slate-700 truncate flex-1">{f.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {f.content === "(추출 중...)" ? "⏳ 추출 중..." : `${Math.round(f.content.length / 1000)}K자`}
                </span>
                <button onClick={() => removeFile(f.label)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 본문 업로드 */}
          <div>
            <input type="file" ref={mainFileRef} onChange={e => e.target.files?.[0] && processFile(e.target.files[0], "본문")}
              accept=".txt,.pdf" className="hidden" />
            <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              onClick={() => mainFileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragActive ? "border-blue-600 bg-blue-50" : "border-slate-250 bg-slate-50/30 hover:border-blue-400 hover:bg-blue-50/30"
              }`}>
              <Upload className="w-5 h-5 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">📄 논문 본문 업로드</p>
              <p className="text-[10px] text-slate-400 mt-1">Main paper (PDF/TXT)</p>
            </div>
          </div>

          {/* 부록/보충자료 업로드 */}
          <div>
            <input type="file" ref={extraFileRef}
              onChange={e => e.target.files?.[0] && processFile(e.target.files[0], "부록·보충자료")}
              accept=".txt,.pdf" className="hidden" />
            <div onClick={() => extraFileRef.current?.click()}
              className="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition-all bg-amber-50/20">
              <Plus className="w-5 h-5 mx-auto text-amber-500 mb-2" />
              <p className="text-xs font-bold text-amber-700">📋 부록 / 보충자료 추가</p>
              <p className="text-[10px] text-amber-500 mt-1">Appendix / Supplement (PDF/TXT)</p>
            </div>
          </div>
        </div>

        {fileError && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span style={{ whiteSpace: "pre-line" }}>{fileError}</span>
          </div>
        )}
      </div>

      {/* 직접 입력 텍스트 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            논문 원문 데이터 직접 입력 (파일 업로드와 병행 가능)
          </label>
          <span className="text-[11px] text-slate-400">총 {totalChars > 0 ? totalChars.toLocaleString() : text.length.toLocaleString()}자</span>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-800 leading-relaxed font-sans transition-colors focus:outline-none focus:border-blue-600"
          placeholder={`초록(Abstract), Methods, Results, Discussion, 통계분석 방법, 이상반응 등을 붙여넣으세요.\n\n부록(Appendix)이나 보충자료(Supplementary)는 위의 '부록 추가' 버튼으로 별도 업로드하거나 여기에 함께 붙여넣기 하세요.\n\n영문 원문을 그대로 넣으면 AI가 한국어 심평원 양식으로 완전 번역합니다.`}
        />
      </div>

      {/* 추가 요청 */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">AI 맞춤 분석 추가 요청사항 (선택)</label>
        <input type="text" value={extra} onChange={e => setExtra(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-blue-600"
          placeholder="예: '부록 Table S2의 서브그룹 분석 결과를 상세히 포함할 것', '한국인 데이터 강조'" />
      </div>

      <div className="pt-2">
        <button onClick={onSubmit} disabled={loading || !text.trim()}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm px-6 py-3.5 rounded-lg transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>심평원 표6서식 요약표 AI 자동 생성하기</span>
          {files.length > 1 && <span className="text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold">{files.length}개 파일</span>}
        </button>
      </div>
    </div>
  );
}
