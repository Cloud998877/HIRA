import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy utility to fetch Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please check Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoint for clinical trial summary
  app.post("/api/summarize", async (req, res) => {
    try {
      const { text, type, seq, extra } = req.body;
      if (!text || !text.trim()) {
        res.status(400).json({ error: "논문 내용이 입력되지 않았습니다." });
        return;
      }

      const client = getGenAI();

      // System instruction to guide the clinical translator professional
      const systemInstruction = `당신은 대한민국 건강보험심사평가원(심평원) 등에 제출할 임상시험 문헌 요약표(전문 신약 청구 서식 - 표6 제출 자료)를 편찬하는 자문 의학 분석가입니다.
입력문헌의 모든 구체적인 임상 수치, 포함/제외 요건의 나열, 임상 환자의 탈락 Flow-chart 상의 명수 및 사유, 그리고 유효성 및 안전성(Any grade vs Grade 3/4 이상반응 명수 및 비율)은 원문에 나타난 바를 한글 의학 용어로 상세히 해석하여 제공하십시오.

[작성 수칙 - 반려 제로화 전략 및 "~임.", "~함." 종결 필수]
1. [핵심] 완벽한 "~임.", "~함." 문장 종결체 원칙:
   - 모든 텍스트의 각 세부 줄(Bullet point 포함)은 단순히 숫자나 영문 약어만 기재되어선 절대 안 되며, 반드시 상세 내용 및 수치 서술과 함께 마지막 어미가 한국어 명사형 격식체인 "~임.", "~함.", "~확인됨.", "~투여됨.", "~나타남.", "~비교됨.", "~제외됨.", "~포함됨." 등으로 확실하고 완벽하게 끝맺음되어야 합니다.
   - 예시 (나쁜 예): "- mPFS: 시험군 NR, 대조군 52.6개월"
   - 예시 (좋은 예): "- 무진행 생존기간(mPFS)의 경우: 시험군은 중앙값에 도달하지 않았으나(NR), 대조군은 52.6개월로 현저한 임상적 격차를 보이며 개선됨."

2. [핵심 안내] 피험자 특성 및 중도 탈락 기술 방식:
   - 두 군(시험군 vs 대조군)의 특성과 중도 탈락 흐름을 단순히 숫자만 늘어놓는 하드코딩 형식으로 적지 마십시오.
   - 반드시 "시험군(DVRd)의 중위 연령은 70세이고 대조군(VRd)의 중위 연령 또한 70세로 양 군 간의 인구통계학적 특성이 고르게 매칭됨." 혹은 "스크리닝에 참여한 508명의 피험자 중 113명이 요건 미달로 탈락하였고, 최종 395명이 1:1로 무작위 배정됨."과 같이 의학적으로 정돈된 분석적 문장으로 서술하되, 문장 어미는 반드시 "~임.", "~함.", "~확인됨." 등으로 세련되게 작성하십시오.

3. [핵심 안내] 안전성 결과(Safety) 기입 가이드라인:
   - 부록에 등장하는 자잘한 부작용(예: 불면증, 요통, 기침 등) 수십 개의 테이블 행을 기계적으로 복사하지 마십시오.
   - **논문 본문(Main Body Text)에 핵심적으로 중요하게 하이라이트된 주요 부작용들**(예: 치료 중단을 초래한 이상반응 비율인 TEAE-led discontinuation, 가장 흔한 3등급 호중구 감소증 및 혈소판 감소증 비율, 주요 3등급 이상 감각신경병증 비율, 중대한 이상반응 결과 등 **최대 5~7개의 유의미한 주요 안전성 지표**)만 엄선하여 작성하십시오.
   - 선별된 안전성 데이터 역시 반드시 시험군 및 대조군의 발생율 및 중증도 수치를 비교 서술하고, 어미를 "~임.", "~함." 등으로 확실하게 종결체로 정리하십시오.

4. 통계 수치 완전성: PFS, OS 등의 위험비(HR), 신뢰구간(95% CI), P-value는 절대로 생략하거나 축약하지 말고 완벽한 세트로 기입하며, 마지막은 역시 "~임."으로 종결하십시오.
5. 선정 및 제외 기준 목록화: 원문에 나열된 조건이 있을 경우, 10개 이상이 되더라도 누락 없이 모두 수치(예: '절대 호중구(ANC) 수가 1.0 X 10^9/L 이상인 환자임.')를 꼼꼼히 적고, 끝에 반드시 '~임.'을 붙이십시오.
6. 절대 줄글(긴 서술형 문단) 쓰기 금지: 모든 텍스트 필드는 반드시 한 줄에 하나씩 '- 항목명: 내용 및 서술(~임).' 또는 '○ 항목명: 내용 및 서술(~임).' 및 숫자가 있는 리스트 방식('1) 내용 및 서술(~임).')으로 작성하십시오.
7. 가독성 극대화: 각 세부 서술에서 마크다운 볼드(**) 기법을 사용해 핵심 비교 지표나 통계 치를 감싸줌으로써 깔끔하게 부각되고, 클라이언트 화면에서 볼드 렌더링이 이루어지게 처리하십시오.`;

      const prompt = `다음 임상문헌 내용을 심평원 양식에 맞추어 완벽하게 구조화해 주십시오.

[기본 정보]
- 신청 연번: ${seq || 1}
- 문헌 내용 구분형태: ${type || "RCT"}
- 추가 요구사항: ${extra || "없음"}

[분석할 논문 원문/요약 텍스트]
${text}

추출 가이드라인에 맞춰 빈 항목 없이 꼼꼼하게 작성해 주세요.`;

      // Define Schema for structured JSON generation
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "논문 제목 전체 (영어 제목 원문 및 괄호 안에 자연스러운 한글 번역 제목 병기)",
          },
          citation: {
            type: Type.STRING,
            description: "출전 정보. 저자명, 저널명, 연도;권(호):페이지 형식으로 완벽한 표준 서지 지표로 기재",
          },
          countries: {
            type: Type.STRING,
            description: "연구가 수행된 모든 국가들 목록 (쉼표 구분)",
          },
          authors: {
            type: Type.STRING,
            description: "주저자 및 주요 공저자 요약 (예: Saad Z. Usmani et al.)",
          },
          affiliation: {
            type: Type.STRING,
            description: "교신저자 및 주저자의 소속기관명 (영문과 자연스러운 한글 번역 병기)",
          },
          objective: {
            type: Type.STRING,
            description: "연구의 공식적인 요약 목표 (예: '~의 안전성 및 유효성을 대조 분석하고자 함.'과 같이 조목조목 나누어 '~함.', '~임.' 종결체로 기재)",
          },
          inclusion: {
            type: Type.STRING,
            description: "참여 환자의 선정(포함) 기준. 10개 이상의 항목일 경우에도 모두 누락 없이 '- 1) [항목]: [의학적 수치/조건]인 환자임.' 형식으로 한 줄 단위로 명확히 끝은 '~임.'으로 맺고 줄바꿈(\\n)하여 나열",
          },
          exclusion: {
            type: Type.STRING,
            description: "참여 환자의 제외 기준. '- 1) [항목]: [의학적 수치/조건]인 환자임.' 형식으로 명확히 끝은 '~임.'으로 맺고 줄바꿈(\\n)하여 나열",
          },
          studyPeriod: {
            type: Type.STRING,
            description: "시험기간 정보. 다음 세 가지 항목을 한 줄씩 명확히 '~임.'으로 끝내며 줄바꿈(\\n)하여 기재: '○ 등록 기간: 2018.12.11 ~ 2019.10.7임.\\n○ 추적관찰 기간: 중앙값 58.7개월임.\\n○ 자료수집완료일: 2024.5.7임.'",
          },
          studyDesign: {
            type: Type.STRING,
            description: "연구 설계 형태. 다국가, 다기관, 무작위배정 등 특징을 한 줄에 하나씩 '- [설계 요소]: [원문 설명]의 무작위배정 임상시험임.' 형식으로 조목조목 기술하고 모든 문체는 '~임.'으로 맺으며 줄바꿈(\\n) 기술",
          },
          intervention: {
            type: Type.STRING,
            description: "시험군 약물 요법 가이드. 약제 Dose, 투여 스케줄, 주기 등을 상세히 나누어 '- [주기/구조]: [상세 주입요법 기술]함.' 또는 '~임.' 형태로 줄바꿈(\\n) 상세 기재",
          },
          control: {
            type: Type.STRING,
            description: "대조군 약물 요법 가이드. 약제 Dose, 투여 스케줄, 주기 등을 상세히 나누어 '- [주기/구조]: [상세 주입요법 기술]함.' 또는 '~임.' 형태로 줄바꿈(\\n) 상세 기재",
          },
          primaryEndpoint: {
            type: Type.STRING,
            description: "1차 평가변수 정의. '- [변수명]: [평가 방식 및 정밀도 기준]으로 정의됨.' 형태로 종결하며 줄바꿈 기술",
          },
          secondaryEndpoints: {
            type: Type.STRING,
            description: "2차 평가변수 목록. 각 평가 변수별로 한 줄씩 '- [변수명]: [분석 및 목적 조건]임.' 형태로 작성하며 줄바꿈(\\n) 나열",
          },
          patientCharacteristics: {
            type: Type.STRING,
            description: "투여 환자의 기저 특성 기재. 시험군과 대조군 양 특성을 단순히 숫자 배열 대신 '- **남성 비율**: 시험군(DVRd)은 44.2%(87명)이고 대조군(VRd)은 56.1%(111명)로 성별 매칭이 양호함.' 과 같이 1:1 대조 리스트로 한 줄씩 '~임.', '~함.', '~양호함.' 서술형 종결어미를 써서 줄바꿈(\\n)하여 기재",
          },
          dropout: {
            type: Type.STRING,
            description: "피험자 탈락률 및 중도 탈락 핵심 사유. 등록 수 대비 층화 배정 비율 및 탈락 원인을 세밀한 의학 서술형으로 쪼개어 '- **[군별 탈락]**: 시험군(DVRd)의 중도탈락자는 총 95명이며 주된 원인은 질병 진행 27명, 이상반응 16명, 사망 34명 등임.' 과 같이 완벽히 '~임.' 또는 '~함.' 종결형으로 한 줄씩 줄바꿈(\\n) 작성",
          },
          results: {
            type: Type.STRING,
            description: "유효성 및 안전성 결과. 1차 평가변수(MRD 음성율, Odds ratio, p-value), 2차 유효성(PFS 및 Hazard Ratio, OS 등 통계치) 및 본문에 강조된 주요 안전성 핵심 결과(영구 투여중단 비율, 가장 흔한 3등급 이상 호중구/혈소판 감소증 비율, 주요 3등급 감각신경병증율 등 핵심 5~7개 지표)를 '- **[평가지표]**: 시험군은 [분석수치]이고 대조군은 [분석수치]로 통계적 유의성이 있음(또는 없음).' 같이 1:1 비교를 완전한 한 문장으로 나누되 어미는 무조건 '~임.', '~함.' 등으로 끝나도록 줄바꿈(\\n)하여 기재",
          },
          conclusion: {
            type: Type.STRING,
            description: "논문 저자들의 핵심 결론 및 심평원 요약 결론 (각 문장 '- **[결론]**: [분석내용]인 것으로 입증됨.' 형태로 깔끔히 종결하여 기재)",
          },
          limitations: {
            type: Type.STRING,
            description: "가장 엄밀한 연구 한계점 2~3개. 각 한계점마다 '- **[한계]**: [상세 제약 사항]이 한계임.' 형태로 종결하여 줄바꿈 기술",
          },
          sponsor: {
            type: Type.STRING,
            description: "연구 자금 지원 및 후원사 정보. '- **[후원]**: [제약사 명칭]에서 전액 후원함.' 형태로 기재",
          },
          sensitivityAnalysis: {
            type: Type.STRING,
            description: "강건함 검증을 위한 민감도 분석 요약. '- **[분석법]**: [수행 결과 조건]임.' 형태로 작성 (없으면 '해당 정보 없음' 기재)",
          },
          researcherPerspective: {
            type: Type.STRING,
            description: "치료의 차별점, 한국인 임상 가치 등 추가 관점 분석 정보. 조목조목 한 줄씩 '- **[의학적 관점]**: [추가적 소견 정보]임.' 형태로 맺으며 줄바꿈 작성",
          },
        },
        required: [
          "title",
          "citation",
          "countries",
          "authors",
          "affiliation",
          "objective",
          "inclusion",
          "exclusion",
          "studyPeriod",
          "studyDesign",
          "intervention",
          "control",
          "primaryEndpoint",
          "secondaryEndpoints",
          "patientCharacteristics",
          "dropout",
          "results",
          "conclusion",
          "limitations",
          "sponsor",
          "sensitivityAnalysis",
          "researcherPerspective"
        ],
      };

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2, // Low temperature for deterministic factual extraction
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Gemini API가 빈 응답을 반환했습니다.");
      }

      const parsedJSON = JSON.parse(responseText.trim());
      res.json(parsedJSON);
    } catch (error: any) {
      console.error("summarize api failed:", error);
      res.status(500).json({ error: error?.message || "문헌 분석 중 알 수 없는 서버 오류가 발생하였습니다." });
    }
  });

  // Serve static UI assets either from Vite (dev) or express.static (prod)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
