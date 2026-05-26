/**
 * Vercel Edge Runtime 함수
 * - Edge Runtime: 타임아웃 없음 (Hobby 플랜 포함)
 * - Gemini REST API 직접 호출 (SDK 불필요, fetch 사용)
 * - gemini-2.0-flash: 빠른 응답, 구조화 출력 지원
 */
export const runtime = "edge";

const SYSTEM_INSTRUCTION = `당신은 대한민국 건강보험심사평가원(심평원) 등에 제출할 임상시험 문헌 요약표(전문 신약 청구 서식 - 표6 제출 자료)를 편찬하는 자문 의학 분석가입니다.
입력문헌의 모든 구체적인 임상 수치, 포함/제외 요건의 나열, 임상 환자의 탈락 Flow-chart 상의 명수 및 사유, 그리고 유효성 및 안전성(Any grade vs Grade 3/4 이상반응 명수 및 비율)은 원문에 나타난 바를 한글 의학 용어로 상세히 해석하여 제공하십시오.

[작성 수칙 - 반려 제로화 전략 및 "~임.", "~함." 종결 필수]
1. 모든 텍스트의 각 세부 줄(Bullet point 포함)은 반드시 상세 내용 및 수치 서술과 함께 "~임.", "~함.", "~확인됨.", "~투여됨.", "~나타남." 등으로 확실하고 완벽하게 끝맺음되어야 합니다.
   - 나쁜 예: "- mPFS: 시험군 NR, 대조군 52.6개월"
   - 좋은 예: "- 무진행 생존기간(mPFS)의 경우: 시험군은 중앙값에 도달하지 않았으나(NR), 대조군은 52.6개월로 현저한 임상적 격차를 보이며 개선됨."

2. 피험자 특성 및 중도 탈락 기술: 단순 숫자 나열 금지. 의학적으로 정돈된 분석적 문장으로 서술하되 어미는 "~임.", "~함.", "~확인됨." 등으로 마무리.

3. 안전성 결과: 논문 본문에서 핵심적으로 하이라이트된 주요 부작용 5~7개만 엄선. 시험군·대조군 발생률 및 중증도 수치를 비교 서술하고 "~임.", "~함." 으로 종결.

4. 통계 수치 완전성: HR, 95% CI, P-value는 절대 생략하지 말고 완벽한 세트로 기입하며 "~임."으로 종결.

5. 선정·제외 기준: 10개 이상이더라도 누락 없이 수치 포함하여 모두 기재, 끝에 "~임." 필수.

6. 절대 줄글 금지: 반드시 "- 항목명: 내용(~임)." 또는 숫자 리스트 방식으로 작성.

7. 가독성: 마크다운 볼드(**) 기법으로 핵심 통계치 강조.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "논문 제목 전체 (영어 원문 + 괄호 안에 한글 번역 병기)" },
    citation: { type: "string", description: "저자명. 저널명. 연도;권(호):페이지 형식 표준 서지" },
    countries: { type: "string", description: "연구 참여 국가 목록 (쉼표 구분)" },
    authors: { type: "string", description: "주저자 및 공저자 (예: Usmani SZ et al.)" },
    affiliation: { type: "string", description: "교신저자 소속기관 (영문 + 한글 번역)" },
    objective: { type: "string", description: "연구 목적 (~함. ~임. 종결체로 기재)" },
    inclusion: { type: "string", description: "포함 기준 전체 (1) 항목: 내용임.\\n2) 항목: 내용임. 형식, 수치 포함)" },
    exclusion: { type: "string", description: "제외 기준 전체 (1) 항목: 내용임.\\n 형식)" },
    studyPeriod: { type: "string", description: "○ 등록 기간: YYYY.MM ~ YYYY.MM임.\\n○ 추적관찰 기간(중앙값): N개월임.\\n○ 자료수집완료일: YYYY.MM.DD임." },
    studyDesign: { type: "string", description: "연구 설계, 무작위배정 방법, 층화 기준 등 (~임. 종결 리스트)" },
    intervention: { type: "string", description: "시험군 약물 용량·경로·주기 상세 (~함. ~임. 종결 리스트)" },
    control: { type: "string", description: "대조군 약물 용량·경로·주기 상세 (~함. ~임. 종결 리스트)" },
    primaryEndpoint: { type: "string", description: "1차 평가변수 정의 및 측정 방법 (~으로 정의됨. 종결)" },
    secondaryEndpoints: { type: "string", description: "2차 평가변수 전체 목록 및 정의 (리스트, ~임. 종결)" },
    patientCharacteristics: { type: "string", description: "양군 기저 특성 비교 (연령·성별·ECOG·ISS·세포유전학적 위험도 등, 1:1 비교 서술, ~임. 종결)" },
    dropout: { type: "string", description: "중도탈락 환자 수 및 사유 (군별 구분, ~임. 종결)" },
    results: { type: "string", description: "○ 유효성 결과\\n(1차·2차 평가변수 수치, OR/HR, 95% CI, p값)\\n\\n○ 안전성 결과\\n(주요 이상반응 5~7개, 등급별 발현율 비교, ~임. 종결)" },
    conclusion: { type: "string", description: "저자 결론 요약 (~임. ~함. 종결, 2~3문장)" },
    limitations: { type: "string", description: "연구 한계점 2~3개 (~이 한계임. 종결)" },
    sponsor: { type: "string", description: "연구 후원자 (~에서 후원함. 종결)" },
    sensitivityAnalysis: { type: "string", description: "민감도 분석 결과 (없으면 '해당 정보 없음')" },
    researcherPerspective: { type: "string", description: "연구자 추가 언급사항 (없으면 '해당 정보 없음')" },
  },
  required: [
    "title","citation","countries","authors","affiliation",
    "objective","inclusion","exclusion","studyPeriod","studyDesign",
    "intervention","control","primaryEndpoint","secondaryEndpoints",
    "patientCharacteristics","dropout","results","conclusion",
    "limitations","sponsor","sensitivityAnalysis","researcherPerspective"
  ],
};

export default async function handler(req: Request): Promise<Response> {
  // CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "POST 요청만 허용됩니다." }, { status: 405, headers: corsHeaders });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel 프로젝트 설정 > Environment Variables에서 추가해 주세요." },
      { status: 500, headers: corsHeaders }
    );
  }

  let body: { text?: string; type?: string; seq?: number; extra?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "요청 본문을 파싱하지 못했습니다." }, { status: 400, headers: corsHeaders });
  }

  const { text, type = "RCT", seq = 1, extra = "없음" } = body;
  if (!text?.trim()) {
    return Response.json({ error: "논문 내용이 입력되지 않았습니다." }, { status: 400, headers: corsHeaders });
  }

  const prompt = `다음 임상문헌 내용을 심평원 양식에 맞추어 완벽하게 구조화해 주십시오.

[기본 정보]
- 신청 연번: ${seq}
- 문헌 내용 구분형태: ${type}
- 추가 요구사항: ${extra}

[분석할 논문 원문/요약 텍스트]
${text}

추출 가이드라인에 맞춰 빈 항목 없이 꼼꼼하게 작성해 주세요.`;

  // Gemini REST API 직접 호출 (Edge Runtime은 SDK 사용 불가, fetch 사용)
  // gemini-2.0-flash: 빠르고 구조화 출력 지원, 타임아웃 위험 낮음
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  let geminiResp: Response;
  try {
    geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      }),
    });
  } catch (fetchErr: any) {
    return Response.json(
      { error: `Gemini API 연결 실패: ${fetchErr.message}` },
      { status: 502, headers: corsHeaders }
    );
  }

  if (!geminiResp.ok) {
    const errText = await geminiResp.text();
    let errMsg = `Gemini API 오류 (${geminiResp.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson?.error?.message || errMsg;
    } catch {}
    // API 키 관련 오류 친절하게 안내
    if (geminiResp.status === 400 || geminiResp.status === 403) {
      errMsg = `API 키 오류: ${errMsg}\nVercel 환경변수 GEMINI_API_KEY 값을 확인해 주세요.`;
    }
    return Response.json({ error: errMsg }, { status: geminiResp.status, headers: corsHeaders });
  }

  const geminiData: any = await geminiResp.json();

  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    return Response.json(
      { error: "Gemini API가 빈 응답을 반환했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500, headers: corsHeaders }
    );
  }

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return Response.json(
      { error: "AI 응답을 JSON으로 파싱하지 못했습니다.\n원문 응답:\n" + rawText.slice(0, 300) },
      { status: 500, headers: corsHeaders }
    );
  }

  return Response.json(parsed, { status: 200, headers: corsHeaders });
}
