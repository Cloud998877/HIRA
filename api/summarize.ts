import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel 프로젝트 설정 > Environment Variables에서 추가해 주세요."
      );
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  try {
    const { text, type, seq, extra } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "논문 내용이 입력되지 않았습니다." });
    }

    const client = getGenAI();

    const systemInstruction = `당신은 대한민국 건강보험심사평가원(심평원) 등에 제출할 임상시험 문헌 요약표(전문 신약 청구 서식 - 표6 제출 자료)를 편찬하는 자문 의학 분석가입니다.
입력문헌의 모든 구체적인 임상 수치, 포함/제외 요건의 나열, 임상 환자의 탈락 Flow-chart 상의 명수 및 사유, 그리고 유효성 및 안전성(Any grade vs Grade 3/4 이상반응 명수 및 비율)은 원문에 나타난 바를 한글 의학 용어로 상세히 해석하여 제공하십시오.

[작성 수칙 - 반려 제로화 전략 및 "~임.", "~함." 종결 필수]
1. [핵심] 완벽한 "~임.", "~함." 문장 종결체 원칙:
   - 모든 텍스트의 각 세부 줄(Bullet point 포함)은 단순히 숫자나 영문 약어만 기재되어선 절대 안 되며, 반드시 상세 내용 및 수치 서술과 함께 마지막 어미가 한국어 명사형 격식체인 "~임.", "~함.", "~확인됨.", "~투여됨.", "~나타남.", "~비교됨.", "~제외됨.", "~포함됨." 등으로 확실하고 완벽하게 끝맺음되어야 합니다.
   - 예시 (나쁜 예): "- mPFS: 시험군 NR, 대조군 52.6개월"
   - 예시 (좋은 예): "- 무진행 생존기간(mPFS)의 경우: 시험군은 중앙값에 도달하지 않았으나(NR), 대조군은 52.6개월로 현저한 임상적 격차를 보이며 개선됨."

2. [핵심 안내] 피험자 특성 및 중도 탈락 기술 방식:
   - 두 군(시험군 vs 대조군)의 특성과 중도 탈락 흐름을 단순히 숫자만 늘어놓는 하드코딩 형식으로 적지 마십시오.
   - 반드시 의학적으로 정돈된 분석적 문장으로 서술하되, 문장 어미는 반드시 "~임.", "~함.", "~확인됨." 등으로 세련되게 작성하십시오.

3. [핵심 안내] 안전성 결과(Safety) 기입 가이드라인:
   - 논문 본문(Main Body Text)에 핵심적으로 중요하게 하이라이트된 주요 부작용들(최대 5~7개의 유의미한 주요 안전성 지표)만 엄선하여 작성하십시오.
   - 선별된 안전성 데이터 역시 반드시 시험군 및 대조군의 발생율 및 중증도 수치를 비교 서술하고, 어미를 "~임.", "~함." 등으로 확실하게 종결체로 정리하십시오.

4. 통계 수치 완전성: PFS, OS 등의 위험비(HR), 신뢰구간(95% CI), P-value는 절대로 생략하거나 축약하지 말고 완벽한 세트로 기입하며, 마지막은 역시 "~임."으로 종결하십시오.
5. 선정 및 제외 기준 목록화: 원문에 나열된 조건이 있을 경우, 10개 이상이 되더라도 누락 없이 모두 수치를 꼼꼼히 적고, 끝에 반드시 '~임.'을 붙이십시오.
6. 절대 줄글(긴 서술형 문단) 쓰기 금지: 모든 텍스트 필드는 반드시 한 줄에 하나씩 '- 항목명: 내용 및 서술(~임).' 또는 숫자가 있는 리스트 방식으로 작성하십시오.
7. 가독성 극대화: 각 세부 서술에서 마크다운 볼드(**) 기법을 사용해 핵심 비교 지표나 통계치를 감싸줌으로써 깔끔하게 부각되게 처리하십시오.`;

    const prompt = `다음 임상문헌 내용을 심평원 양식에 맞추어 완벽하게 구조화해 주십시오.

[기본 정보]
- 신청 연번: ${seq || 1}
- 문헌 내용 구분형태: ${type || "RCT"}
- 추가 요구사항: ${extra || "없음"}

[분석할 논문 원문/요약 텍스트]
${text}

추출 가이드라인에 맞춰 빈 항목 없이 꼼꼼하게 작성해 주세요.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        citation: { type: Type.STRING },
        countries: { type: Type.STRING },
        authors: { type: Type.STRING },
        affiliation: { type: Type.STRING },
        objective: { type: Type.STRING },
        inclusion: { type: Type.STRING },
        exclusion: { type: Type.STRING },
        studyPeriod: { type: Type.STRING },
        studyDesign: { type: Type.STRING },
        intervention: { type: Type.STRING },
        control: { type: Type.STRING },
        primaryEndpoint: { type: Type.STRING },
        secondaryEndpoints: { type: Type.STRING },
        patientCharacteristics: { type: Type.STRING },
        dropout: { type: Type.STRING },
        results: { type: Type.STRING },
        conclusion: { type: Type.STRING },
        limitations: { type: Type.STRING },
        sponsor: { type: Type.STRING },
        sensitivityAnalysis: { type: Type.STRING },
        researcherPerspective: { type: Type.STRING },
      },
      required: [
        "title", "citation", "countries", "authors", "affiliation",
        "objective", "inclusion", "exclusion", "studyPeriod", "studyDesign",
        "intervention", "control", "primaryEndpoint", "secondaryEndpoints",
        "patientCharacteristics", "dropout", "results", "conclusion",
        "limitations", "sponsor", "sensitivityAnalysis", "researcherPerspective",
      ],
    };

    // 사용 가능한 최신 Gemini 모델로 수정 (gemini-3.5-flash는 존재하지 않음)
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Gemini API가 빈 응답을 반환했습니다.");
    }

    const parsedJSON = JSON.parse(responseText.trim());
    return res.status(200).json(parsedJSON);
  } catch (error: any) {
    console.error("summarize api failed:", error);
    return res.status(500).json({
      error: error?.message || "문헌 분석 중 알 수 없는 서버 오류가 발생하였습니다.",
    });
  }
}
