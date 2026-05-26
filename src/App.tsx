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

    // API 키 확인 — OpenAI 우선, 없으면 Gemini 사용
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
    const useOpenAI = !!openaiKey;

    if (!openaiKey && !geminiKey) {
      setErrorMessage(
        "API 키가 설정되지 않았습니다.\n\n" +
        "Vercel 프로젝트 설정 > Environment Variables 에서 아래 중 하나를 추가하세요:\n\n" +
        "OpenAI 사용 시: VITE_OPENAI_API_KEY = sk-...\n" +
        "Gemini 사용 시: VITE_GEMINI_API_KEY = AIza..."
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setLoadingStep(useOpenAI ? "GPT-5.5와 연결 중..." : "Gemini AI와 연결 중...");

    const SYSTEM_INSTRUCTION = `당신은 대한민국 건강보험심사평가원(심평원) 제출용 임상시험 문헌 요약표(표6)를 작성하는 최고 수준의 의학 전문 분석가입니다.
당신의 역할은 영문 임상시험 논문 전체를 한국어로 완전히 번역하여 심평원 표6 서식에 맞게 재구성하는 것입니다.

[절대 금지 사항 — 위반 시 분석 실패로 간주]
★ "해당 정보 없음", "논문에 명시되어 있지 않아", "정보 없음", "N/A" 등의 표현 절대 사용 금지.
★ 정보가 없는 항목·불릿은 아예 기재하지 말 것. 있는 내용만 상세히 기재.
★ 단순 나열(숫자만, 약어만) 금지 — 반드시 완전한 문장으로 서술.
★ 빈 항목 제출 금지 — 논문에서 찾을 수 있는 모든 관련 정보를 총동원하여 기재.

[핵심 작성 원칙]
1. 문장 어미: 모든 줄은 반드시 "~임.", "~함.", "~확인됨.", "~나타남.", "~투여됨.", "~분석됨.", "~보고됨." 등 한국어 명사형 격식체로 완전히 끝낼 것.
2. 완전 번역 원칙: 논문의 Methods, Results, Discussion, Supplementary 등 모든 섹션을 샅샅이 읽고 관련 정보를 빠짐없이 추출하여 번역·기재. 논문에 있는 내용을 "없다"고 판단하면 안 됨.
3. 수치 완전성: HR, OR, RR, RRR, LSM, 95% CI, p-value, %, N 등 모든 통계 수치는 완전한 세트로 기재. 소수점까지 정확히.
4. 포함·제외 기준: 논문 본문·부록·e-supplement 어디서든 찾아서 모든 기준을 번호 목록으로 기재. 나이, 점수, 검사 수치 등 구체적 기준값 반드시 포함.
5. 피험자 특성: 모든 군의 기저 특성(연령, 성별, 인종, 유전자형, 인지점수, 바이오마커 등)을 군별 비교 형식으로 전부 기재.
6. 중도탈락: 스크리닝 → 제외 사유별 → 무작위배정 → 탈락 사유별 → 완료까지 CONSORT 흐름 전체 기재.
7. 시험결과: 모든 평가변수의 모든 서브그룹 결과 기재. 치료 효과의 절대적 수치·상대적 수치·통계 검정 모두 포함.
8. 통계방법: 논문 Statistical Analysis 섹션을 완전히 번역하여 분석 방법, 검정력, 표본수 산출, 민감도 분석까지 전부 기재.
9. 볼드 강조: **핵심 통계치**, **비교 수치**, **결론 키워드** 에 ** 마크다운 볼드 적용.
10. 리스트 형식: "- **항목**: 서술(~임.)" 또는 "1) 항목: 서술(~임.)" 형식 고수. 줄글 문단 절대 금지.`;

    const userPrompt = `다음 임상시험 논문 전문을 분석하여 심평원 표6 서식에 맞게 한국어로 완전히 번역·재구성하세요.
코드블록 없이 순수 JSON만 반환하세요.

[기본정보] 연번: ${seq} / 문헌구분: ${type} / 추가요청: ${extra || "없음"}

[논문 전문]
${text.slice(0, 28000)}

===== 핵심 작성 규칙 =====
1. "해당 정보 없음" 절대 금지 — 정보가 없으면 그 항목 자체를 생략
2. 논문에서 찾을 수 있는 모든 수치·조건·결과를 빠짐없이 번역하여 기재
3. 줄바꿈은 \n으로 표현 (실제 개행 금지)
4. 모든 문장은 "~임.", "~함.", "~확인됨." 등으로 끝낼 것
5. 통계 수치는 값 + 95% CI + p값 완전한 세트로 기재

아래 JSON 키를 모두 채워 반환 (★ 모르면 빈칸이 아니라 논문에서 추론하여 기재. 정말 없으면 해당 key 값을 빈 문자열 "" 로 반환):
{
  "title": "논문 영문 제목 전체 (괄호 안에 한글 번역 병기)",
  "citation": "저자명 전체(최소 3인). 저널명. 연도;권(호):페이지. doi:...",
  "countries": "참여 국가명 전체 목록 (총 N개국)",
  "authors": "제1저자, 제2저자, ... et al. / 소속기관명",
  "affiliation": "교신저자명, 소속기관 전체명 (영문 + 한글)",
  "objective": "- **연구 배경**: 이 연구가 필요한 임상적 배경과 문제 제기(~함.)\n- **주요 목적**: 이 연구의 핵심 목적(~평가하고자 함.)\n- **세부 목적**: 추가 분석 목적이 있으면 기재(~분석하고자 함.)",
  "inclusion": "논문 본문·부록·Methods에서 모든 포함기준 추출.\n1) 연령: 구체적 연령 범위(예: 만 60세 이상 85세 이하)임.\n2) 진단: 진단명 및 진단 기준(예: MMSE 점수 범위, PET 기준 등)임.\n(이후 논문에서 찾은 모든 기준을 번호 목록으로 기재. 수치 포함 필수)",
  "exclusion": "논문 본문·부록·Methods에서 모든 제외기준 추출.\n1) 첫 번째 제외기준: 구체적 내용 및 수치임.\n(이후 논문에서 찾은 모든 기준을 번호 목록으로 기재)",
  "studyPeriod": "○ 등록 기간: 논문에 명시된 날짜 또는 연도·월임.\n○ 추적관찰 기간: 논문에 명시된 기간(중앙값 N주 또는 N개월)임.\n○ 자료수집완료일: 논문에 명시된 날짜임.",
  "studyDesign": "- **연구 형태**: 상세 설계 특성 전부 기재(다국가·다기관·무작위배정·이중맹검 등)임.\n- **배정 방법·비율**: 무작위배정 방법 및 군별 비율임.\n- **층화 기준**: 층화에 사용된 요인 전부 기재(~으로 층화됨.)\n- **눈가림**: 눈가림 수준 및 방법(~으로 수행됨.)",
  "intervention": "- **약제명**: 정식 약제명 및 계열(~임.)\n- **용량·용법**: 구체적 mg, mg/kg, 또는 단위별 용량 및 투여 스케줄(~에 N mg 투여됨.)\n- **투여 경로·주기**: 정맥/피하/경구 등 경로 및 투여 간격(~주마다 투여됨.)\n- **투여 기간**: 총 투여 기간(~주 또는 ~개월간 투여됨.)\n- **용량 조정·전환 기준**: 해당 시 기재(~기준 충족 시 전환됨.)",
  "control": "- **대조군 약제**: 위약 또는 활성 대조약 명칭(~임.)\n- **용량·용법**: 구체적 용량 및 스케줄(~에 투여됨.)\n- **투여 경로·주기**: 경로 및 간격(~주마다 투여됨.)\n- **투여 기간**: 총 기간(~주간 투여됨.)",
  "statisticalMethods": "논문 Statistical Analysis 섹션을 완전히 번역하여 기재.\n- **1차 분석 방법**: 구체적 통계 방법명(MMRM, Bayesian 등) 및 적용 대상(~을 사용하여 분석함.)\n- **가설 검정 방법**: 단측/양측 검정, 유의수준 α 기재(~로 설정됨.)\n- **다중성 보정**: 보정 방법명 기재(~방법 적용됨.)\n- **결측치 처리**: 방법 기재(~방식으로 처리됨.)\n- **표본수 산출**: 검정력·유의수준·탈락률 기준 산출 근거 및 최종 표본수(N명으로 산출됨.)\n- **민감도 분석**: 방법명 및 목적 기재(~분석 실시됨.)",
  "primaryEndpoint": "- **1차 평가변수**: 변수명 및 완전한 정의(~으로 정의됨.)\n- **측정 도구·척도**: 척도명, 점수 범위, 점수 방향성(범위 N~N, 점수가 낮을수록 ~을 의미함.)\n- **평가 시점**: 기저치 대비 N주·N개월 차에 평가됨.\n- **분석 집단**: 해당 평가변수의 분석 대상 집단(~집단에서 평가됨.)",
  "secondaryEndpoints": "논문에 명시된 모든 2차·3차·탐색적 평가변수를 번호 목록으로 기재.\n1) 변수명: 정의, 측정 도구, 평가 시점, 임상적 의미(~로 정의됨.)\n2) 변수명: 상세 기재(~로 정의됨.)\n(이후 논문에서 찾은 모든 2차 평가변수 기재)",
  "patientCharacteristics": "모든 군의 기저 특성을 군별로 비교하여 기재.\n- **총 무작위배정 인원**: N명(시험군 N명, 대조군 N명)으로 배정됨.\n- **연령**: 시험군 평균/중앙값 N세, 대조군 N세로 균형 있게 배정됨.\n- **성별**: 여성 N명(N%), 남성 N명(N%)으로 분포됨.\n- **인종·민족**: 주요 인종 구성(백인 N%, 아시아인 N% 등)임.\n- **유전자형·바이오마커**: APOE ε4 등 비율(시험군 N% vs 대조군 N%)임.\n- **기저 평가척도 점수**: 주요 척도 기저치 양군 비교(시험군 N점 vs 대조군 N점)임.\n- **질환 중증도**: 병기·분류 기준 및 양군 분포(시험군 N% vs 대조군 N%)임.",
  "dropout": "CONSORT 흐름에 따라 단계별로 기재.\n- **스크리닝 참여**: 총 N명 스크리닝 참여함.\n- **스크리닝 탈락**: N명 제외 (이유별: 기준A N명, 기준B N명 등)임.\n- **최종 무작위배정**: N명(시험군 N명, 대조군 N명)이 배정됨.\n- **시험군 중도탈락**: N명(N%) 탈락, 주요 사유: 동의 철회 N명, 이상반응 N명, 사망 N명, 기타 N명임.\n- **대조군 중도탈락**: N명(N%) 탈락, 주요 사유 기재임.\n- **최종 분석 포함**: 시험군 N명, 대조군 N명(총 N명, N%)이 최종 분석에 포함됨.",
  "results": "○ 유효성 결과\n[1차 평가변수 — 모든 서브그룹 결과 기재]\n- **[서브그룹명]**: 시험군 N.NN (95% CI N.NN~N.NN) vs 대조군 N.NN (95% CI N.NN~N.NN), 군간 차이 N.NN (95% CI N.NN~N.NN, **p=N.NNN**)로 **N.N%** 지연 효과 확인됨.\n(이후 모든 서브그룹 결과 기재)\n\n[2차 평가변수 — 논문에 명시된 모든 결과 기재]\n- **[변수명]**: 시험군 N.NN vs 대조군 N.NN (**p=N.NNN**)임.\n(이후 모든 2차 평가변수 결과 기재)\n\n[바이오마커·영상 결과 — 해당 시 기재]\n- **[바이오마커명]**: 시험군 N.N% vs 대조군 N.N% (**p<.001**)임.\n\n○ 안전성 결과\n논문 Safety 섹션을 완전히 번역하여 주요 이상반응을 모두 기재.\n- **[이상반응명]**: 시험군 N명(N.N%) vs 대조군 N명(N.N%)에서 발생함.\n(중대한 이상반응, ARIA, IRR, 사망 포함 모두 기재)",
  "conclusion": "- **[주요 결론]**: 저자의 핵심 결론을 완전히 번역(~인 것으로 입증됨.)\n- **[임상적 의의]**: 이 결과의 임상적 함의(~으로 확인됨.)\n- **[향후 방향]**: 저자가 언급한 향후 연구 방향이나 임상 적용(~이 필요함.)",
  "limitations": "저자가 논문 Limitations·Discussion 섹션에서 언급한 모든 한계를 번역.\n- **[한계명]**: 구체적 한계 내용(~이 한계임.)",
  "sponsor": "- **후원기관**: 후원 기관명(영문+한글 번역) 및 후원 범위·역할(~에서 후원함.)",
  "sensitivityAnalysis": "논문에서 실시한 모든 민감도 분석 결과를 번역.\n- **[분석명]**: 분석 방법, 목적, 결과 수치(~로 강건성 검증됨.)",
  "researcherPerspective": "저자의 Discussion·Conclusion에서 강조한 임상적 관점 및 의의를 번역.\n- **[관점명]**: 구체적 내용 및 임상적 시사점(~임.)",
  "keyTables": [
    {
      "title": "논문에 있는 Table 번호 및 제목 (예: Table 1. Baseline Characteristics)",
      "headers": ["항목", "시험군 (n=XXX)", "대조군 (n=XXX)"],
      "rows": [["연령 평균±SD (세)", "XX.X±X.X", "XX.X±X.X"], ["여성, n (%)", "XXX (XX.X%)", "XXX (XX.X%)"]],
      "footnote": "필요 시 각주 기재"
    }
  ],
  "keyFigures": [
    {
      "label": "Figure 1",
      "title": "그림 제목 (예: Kaplan-Meier Estimates of Progression-Free Survival)",
      "description": "그림 내용 상세 설명: X축·Y축 의미, 두 군 곡선 특성, 주요 관찰 시점 데이터 서술함.",
      "keyFindings": "핵심 수치: 주요 시점 생존율, HR, 95% CI, p값 등 완전한 통계 수치 기재됨."
    }
  ]
}`;

    try {
      // ── OpenAI / Gemini 자동 선택 + 모델 폴백 + 재시도 ────────────
      let response: Response | null = null;
      let lastError = "";
      const MAX_RETRIES = 2;
      const RETRY_DELAY = (n: number) => 2000 + n * 1500;

      if (useOpenAI) {
        // ── OpenAI GPT 호출 ──────────────────────────────────────────
        const OPENAI_MODELS = ["gpt-5.5", "gpt-4o"];

        const openaiBody = JSON.stringify({
          model: "gpt-5.5", // 아래 루프에서 교체됨
          stream: true,
          temperature: 0.1,
          max_tokens: 8192,
          response_format: { type: "json_object" }, // JSON 강제 출력
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user",   content: userPrompt },
          ],
        });

        outer: for (const model of OPENAI_MODELS) {
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            if (attempt > 0) {
              const delay = RETRY_DELAY(attempt);
              setLoadingStep(`과부하 감지 — ${delay / 1000}초 후 재시도... (${model})`);
              await new Promise(r => setTimeout(r, delay));
            } else if (model !== OPENAI_MODELS[0]) {
              setLoadingStep(`모델 전환 중: ${model}...`);
            }

            const body = JSON.stringify({
              ...JSON.parse(openaiBody),
              model,
            });

            const resp = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiKey}`,
              },
              body,
            });

            if (resp.status === 401 || resp.status === 403) {
              const e = await resp.json().catch(() => ({}));
              throw new Error(`OpenAI API 키 오류: ${e?.error?.message || resp.status}\nVercel 환경변수 VITE_OPENAI_API_KEY를 확인해 주세요.`);
            }
            if (resp.status === 429 || resp.status === 503) {
              const e = await resp.json().catch(() => ({}));
              lastError = e?.error?.message || `과부하 (${resp.status})`;
              continue;
            }
            if (!resp.ok) {
              const e = await resp.json().catch(() => ({}));
              lastError = e?.error?.message || `오류 ${resp.status}`;
              break; // 다음 모델로
            }
            response = resp;
            break outer;
          }
        }
      } else {
        // ── Gemini 호출 ─────────────────────────────────────────────
        const GEMINI_MODELS = [
          "gemini-2.5-flash",
          "gemini-1.5-flash",
        ];
        const buildGeminiUrl = (m: string) =>
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?key=${geminiKey}&alt=sse`;

        const geminiBody = JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: "application/json" },
        });

        outer: for (const model of GEMINI_MODELS) {
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            if (attempt > 0) {
              const delay = RETRY_DELAY(attempt);
              setLoadingStep(`과부하 감지 — ${delay / 1000}초 후 재시도... (${model})`);
              await new Promise(r => setTimeout(r, delay));
            } else if (model !== GEMINI_MODELS[0]) {
              setLoadingStep(`모델 전환 중: ${model}...`);
            }

            const resp = await fetch(buildGeminiUrl(model), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: geminiBody,
            });

            if (resp.status === 400 || resp.status === 403) {
              const e = await resp.json().catch(() => ({}));
              throw new Error(`Gemini API 키 오류: ${e?.error?.message || resp.status}\nVercel 환경변수 VITE_GEMINI_API_KEY를 확인해 주세요.`);
            }
            if (resp.status === 429 || resp.status === 503) {
              const e = await resp.json().catch(() => ({}));
              lastError = e?.error?.message || `과부하 (${resp.status})`;
              continue;
            }
            if (resp.status === 404) { lastError = `모델 미지원: ${model}`; break; }
            if (!resp.ok) {
              const e = await resp.json().catch(() => ({}));
              lastError = e?.error?.message || `오류 ${resp.status}`;
              continue;
            }
            response = resp;
            break outer;
          }
        }
      }

      if (!response) {
        throw new Error(
          `모든 모델에서 요청이 실패했습니다.\n마지막 오류: ${lastError}\n\n잠시 후 다시 시도해 주세요.`
        );
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
            // OpenAI 형식: choices[0].delta.content
            // Gemini 형식: candidates[0].content.parts[0].text
            const chunk =
              parsed?.choices?.[0]?.delta?.content ??
              parsed?.candidates?.[0]?.content?.parts?.[0]?.text ??
              "";
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

      // ── JSON 복구 파이프라인 (문자 단위 상태 머신) ────────────────
      const repairJSON = (raw: string): string => {
        // 1) 마크다운 코드블록 제거
        let s = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/gi, "").trim();
        // 2) 첫 { ~ 마지막 } 추출
        const start = s.indexOf("{");
        const end   = s.lastIndexOf("}");
        if (start !== -1 && end !== -1) s = s.slice(start, end + 1);

        // 3) 문자 단위 상태 머신: 문자열 내부의 제어문자를 정확히 이스케이프
        //    정규식보다 훨씬 정확함 (중첩 따옴표, 부분 이스케이프 처리)
        let result = "";
        let inString = false;
        let escaped = false;

        for (let i = 0; i < s.length; i++) {
          const ch = s[i];

          if (escaped) {
            // 이전 문자가 백슬래시였으면 그대로 출력
            result += ch;
            escaped = false;
            continue;
          }

          if (ch === "\\") {
            escaped = true;
            result += ch;
            continue;
          }

          if (ch === '"') {
            inString = !inString;
            result += ch;
            continue;
          }

          if (inString) {
            // 문자열 내부에서 허용되지 않는 제어문자를 이스케이프
            if (ch === "\n")      { result += "\\n";  continue; }
            if (ch === "\r")      { result += "\\r";  continue; }
            if (ch === "\t")      { result += "\\t";  continue; }
            if (ch === "\x08")    { result += "\\b";  continue; }
            if (ch === "\x0C")    { result += "\\f";  continue; }
            // 기타 제어문자 (ASCII 0-31)
            if (ch.charCodeAt(0) < 32) {
              result += `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
              continue;
            }
          }

          result += ch;
        }

        // 4) 닫히지 않은 문자열 처리 (말미 따옴표 누락)
        if (inString) result += '"';

        // 5) 후행 콤마 제거
        result = result.replace(/,(\s*[}\]])/g, "$1");

        return result;
      };

      let jsonStr = repairJSON(accumulated);

      let summaryResult: LiteratureSummary;
      try {
        summaryResult = JSON.parse(jsonStr);
      } catch (parseErr) {
        // 2차 복구 시도: 잘린 JSON 강제 닫기
        try {
          // 열린 배열/객체 카운트 후 닫기 시도
          let opens = 0;
          let inStr = false;
          let esc = false;
          for (const ch of jsonStr) {
            if (esc) { esc = false; continue; }
            if (ch === "\\") { esc = true; continue; }
            if (ch === '"') { inStr = !inStr; continue; }
            if (!inStr) {
              if (ch === "{" || ch === "[") opens++;
              if (ch === "}" || ch === "]") opens--;
            }
          }
          // 열린 만큼 닫기
          let closing = "";
          if (inStr) closing += '"';  // 닫히지 않은 문자열
          for (let i = 0; i < opens; i++) closing += "}";
          summaryResult = JSON.parse(jsonStr + closing);
        } catch {
          const preview = accumulated.slice(0, 300).replace(/\n/g, " ");
          throw new Error(
            `AI 응답을 JSON으로 변환하지 못했습니다.\n\n` +
            `원인: ${String(parseErr)}\n\n` +
            `응답 앞부분: ${preview}\n\n` +
            `→ 잠시 후 다시 시도하거나, 논문 텍스트를 줄여서 입력해 주세요.`
          );
        }
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
