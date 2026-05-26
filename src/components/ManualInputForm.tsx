import React, { useRef } from "react";
import { Upload, FileText, AlertCircle, Sparkles, BookOpen } from "lucide-react";
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

export default function ManualInputForm({
  seq,
  setSeq,
  type,
  setType,
  text,
  setText,
  extra,
  setExtra,
  onSubmit,
  loading,
}: ManualInputFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = React.useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const extractTextFromPDF = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            reject(new Error("PDF.js 라이브러리가 로드되지 않았습니다. 현재 오프라인 상태이거나 로드 중입니다."));
            return;
          }

          // Use secure un-throttled worker path from CDN
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;
          let fullText = "";
          const pageLimit = Math.min(pdf.numPages, 45); // Support up to 45 pages of medical papers nicely

          for (let i = 1; i <= pageLimit; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            let lastY = -1;
            let pageText = "";
            
            for (const item of textContent.items) {
              // Standard item positioning check to retain proper line spacing
              if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                pageText += "\n";
              }
              pageText += item.str + " ";
              lastY = item.transform[5];
            }
            
            fullText += `--- PAGE ${i} ---\n` + pageText + "\n\n";
          }

          resolve(fullText);
        } catch (err: any) {
          reject(err);
        }
      };
      fileReader.onerror = () => reject(new Error("PDF 바이너리를 읽어들이지 못했습니다."));
      fileReader.readAsArrayBuffer(file);
    });
  };

  const processFile = async (file: File) => {
    setFileError(null);
    if (!file) return;

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".pdf") && file.type !== "text/plain" && file.type !== "application/pdf") {
      setFileError("텍스트(.txt) 또는 PDF 형식의 의학 문헌 파일만 업로드할 수 있습니다.");
      return;
    }

    setAttachedFileName(`${file.name} (처리 중...)`);

    if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
      try {
        const textFromPdf = await extractTextFromPDF(file);
        if (textFromPdf && textFromPdf.trim().length > 50) {
          setText(textFromPdf);
          setAttachedFileName(file.name);
          setFileError(null);
        } else {
          throw new Error("추출된 텍스트가 극히 적거나 존재하지 않습니다. 스캔 이미지 전용 PDF인 것으로 예상처리 됩니다.");
        }
      } catch (err: any) {
        setAttachedFileName(null);
        setFileError(`PDF 추출 실패: ${err.message || "텍스트 레이어가 부재합니다."}\n보안 파일이거나 스캔 전용 이미지 PDF일 수 있으니 논문 내용을 웹브라우저에서 직접 영문 복사 붙여넣기를 권장합니다.`);
      }
    } else {
      // Handle normal plain text TXT files
      const r = new FileReader();
      r.onload = (e) => {
        const rawText = e.target?.result as string;
        if (rawText && rawText.trim().length > 10) {
          setText(rawText);
          setAttachedFileName(file.name);
          setFileError(null);
        } else {
          setAttachedFileName(null);
          setFileError("텍스트 파일이 비어 있습니다.");
        }
      };
      r.onerror = () => {
        setAttachedFileName(null);
        setFileError("텍스트 파일을 가져오지 못했습니다.");
      };
      r.readAsText(file, "UTF-8");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const loadPreset = (preset: SamplePaper) => {
    setAttachedFileName(`[샘플 적용] ${preset.title}`);
    setText(preset.text);
    setType(preset.type);
  };

  return (
    <div className="space-y-6">
      {/* Sample Papers Section */}
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
            <button
              key={paper.id}
              onClick={() => loadPreset(paper)}
              className="text-left bg-white hover:bg-slate-50/50 hover:border-slate-350 border border-slate-200 rounded-xl p-4 cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  {paper.type}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-medium transition-colors">
                  불러오기 &rarr;
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1 group-hover:text-blue-900">
                {paper.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {paper.shortDesc}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Sequence & Classification Input */}
        <div>
          <label htmlFor="f-seq" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            연번 (No.)
          </label>
          <input
            id="f-seq"
            type="number"
            min={1}
            value={seq}
            onChange={(e) => setSeq(Number(e.target.value) || 1)}
            className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 transition-colors focus:outline-none focus:border-blue-600 font-medium"
            placeholder="1"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="f-type" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            제출 문헌 형태 분류
          </label>
          <select
            id="f-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 transition-colors focus:outline-none focus:border-blue-600 cursor-pointer font-medium"
          >
            <option value="RCT">Randomized controlled trial (RCT) - 무작위배정 대조 임상시험</option>
            <option value="cohort">Case-control or cohort studies - 환자대조군 또는 코호트 연구</option>
            <option value="single">Single arm study - 단일군 비대조 임상연구</option>
            <option value="case">Case report or case series - 증례보고 또는 증례군의 연구</option>
            <option value="other">기타</option>
          </select>
        </div>
      </div>

      {/* File Drag and Drop Workspace */}
      <div className="relative">
        <input
          type="file"
          id="f-uploader"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.pdf"
          className="hidden"
        />
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-blue-600 bg-blue-50/50 scale-[0.99]"
              : "border-slate-250 bg-slate-50/30 hover:border-slate-350 hover:bg-slate-50/70"
          }`}
        >
          <Upload className="w-7 h-7 mx-auto text-slate-400 group-hover:scale-105 transition-transform mb-3" />
          <p className="text-xs font-bold text-slate-700">
            {attachedFileName ? (
              <span className="text-blue-700 font-extrabold block truncate max-w-md mx-auto">
                📎 적용 파일: {attachedFileName}
              </span>
            ) : (
              "임상시험 원문 텍스트(.txt) 파일 업로드"
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            클릭하거나 여기에 문헌 텍스트 파일을 끌어다 놓으세요.
          </p>
          <span className="text-[10px] text-amber-600 font-semibold block mt-1">
            ※ PDF 문헌은 레이어가 잠겨있거나 드래그가 안 될 경우 붙여넣기를 직접 활용해 주세요.
          </span>
        </div>
        {fileError && (
          <div className="mt-2.5 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5/3">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{fileError}</span>
          </div>
        )}
      </div>

      {/* Primary Text Entry */}
      <div>
        <label htmlFor="f-text" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          논문 원문 데이터 붙여넣기 (초록, 방법, 통계, 결과, 이상반응 필수)
        </label>
        <textarea
          id="f-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-800 leading-relaxed font-sans transition-colors focus:outline-none focus:border-blue-600"
          placeholder={`학술 데이터베이스(PubMed 등)에 기재된 영문 Abstract, Patients & Methods, Clinical Efficacy Results, Toxicity & Grade 3/4 Adverse Events 등을 그대로 긁어서 붙여넣기 해 주면 자연스러운 식약처·심평원용 국문 표현으로 번역 교정 가공합니다.

[입력 가이드]
- 원문 영어 텍스트를 그대로 넣으시면 됩니다. (AI가 완벽히 전문 의학 국문 용어로 번역 및 정리합니다.)
- 1차 평가변수, 유의성 검정 HR(95% CI), p-value 등 핵심 요소를 많이 제공할수록 결과가 매우 풍부해집니다.`}
        />
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5 px-0.5">
          <span>영문 전문(Full text) 혹은 초록 + 주요 분석 내용 권장</span>
          <span>공백 포함 {text.length}자</span>
        </div>
      </div>

      {/* Customized Directives */}
      <div>
        <label htmlFor="f-extra" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          AI 맞춤 분석 추가 요청사항 (선택)
        </label>
        <input
          id="f-extra"
          type="text"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 transition-colors focus:outline-none focus:border-blue-600"
          placeholder="예: '한국인 서브그룹 데이터가 포함되어 있으니 안전성 파트에 반드시 기입할 것', 'mPFS 값을 집중 분석할 것'"
        />
      </div>

      {/* Button */}
      <div className="pt-2">
        <button
          onClick={onSubmit}
          disabled={loading || !text.trim()}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm px-6 py-3.5 rounded-lg transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm select-none"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>심평원 표6서식 요약표 AI 자동 생성하기</span>
        </button>
      </div>
    </div>
  );
}
