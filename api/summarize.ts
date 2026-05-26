/**
 * Vercel Edge Runtime — Gemini 스트리밍 API
 * - 스트리밍: 첫 토큰부터 즉시 클라이언트로 전송 → 타임아웃 없음
 * - JSON 스키마 제거: 스키마 검증 오버헤드 제거로 응답 속도 2~3배 향상
 * - gemini-2.0-flash: 빠른 고품질 모델
 */
export const runtime = "edge";

const SYSTEM_INSTRUCTION = `당신은 대한민국 건강보험심사평가원(심평원) 제출용 임상시험 문헌 요약표(표6) 전문 작성가입니다.

[필수 작성 원칙]
1. 모든 문장 어미는 반드시 "~임.", "~함.", "~확인됨.", "~나타남." 등 한국어 명사형 격식체로 끝낼 것
2. 통계 수치(HR, 95% CI, p-value, OR)는 절대 생략 없이 완전한 세트로 기재
3. 포함·제외 기준은 번호 목록으로 수치 포함하여 전부 기재
4. 안전성 결과는 본문에서 강조된 주요 이상반응 5~7개만 시험군·대조군 비교 서술
5. 핵심 통계치는 **볼드** 처리
6. 줄글 금지 — 모든 항목은 "- 항목: 내용(~임)." 리스트 형식
7. 번역투("~것으로 나타났다") 금지 → "~으로 확인되었음."`;

const JSON_PROMPT_TEMPLATE = (text: string, type: string, seq: number, extra: string) => `
다음 임상문헌을 분석하여 심평원 표6 서식에 맞게 아래 JSON 형식으로 작성하세요.
코드블록(\`\`\`) 없이 순수 JSON만 반환하세요.

[기본정보] 연번: ${seq} / 문헌구분: ${type} / 추가요청: ${extra || "없음"}

[논문내용]
${text.slice(0, 6000)}

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
  "intervention": "- 시험군 약물: 용량·경로·주기 포함 상세 내용임.\\n- 유지요법: 내용임.",
  "control": "- 대조군 약물: 용량·경로·주기 포함 상세 내용임.",
  "primaryEndpoint": "- 1차 평가변수: 정의 및 측정방법 (~으로 정의됨.)",
  "secondaryEndpoints": "1) 2차 평가변수명: 정의 및 목적임.\\n2) ...",
  "patientCharacteristics": "- **중위 연령**: 시험군 N세, 대조군 N세로 양군이 균형 있게 배정됨.\\n- **성별 분포**: ...임.\\n- **ECOG 점수**: ...임.\\n- **병기**: ...임.",
  "dropout": "- **등록 및 배정**: 총 N명 스크리닝 중 N명 무작위배정됨.\\n- **시험군 탈락**: N명 중도탈락, 주요 사유: 진행 N명, 사망 N명, 이상반응 N명임.\\n- **대조군 탈락**: N명 중도탈락, 주요 사유: ...임.",
  "results": "○ 유효성 결과\\n- **1차 평가변수**: 시험군 N% vs 대조군 N% (**OR/HR N.NN, 95% CI N.NN~N.NN, p=N.NNNN**)임.\\n- **2차 평가변수(PFS)**: ...임.\\n- **OS**: ...임.\\n\\n○ 안전성 결과\\n- **가장 흔한 3등급 이상 이상반응**: 시험군 N% vs 대조군 N%임.\\n- **주요 이상반응 1**: ...임.\\n- **치료 중단율**: ...임.",
  "conclusion": "- **주요 결론**: ...인 것으로 최종 확인됨.\\n- **임상적 의의**: ...를 지지함.",
  "limitations": "- **한계 1**: ...이 한계임.\\n- **한계 2**: ...이 한계임.",
  "sponsor": "- **후원**: ...에서 전액 후원함.",
  "sensitivityAnalysis": "- **민감도 분석**: ...임. (없으면 '해당 정보 없음')",
  "researcherPerspective": "- **연구자 관점**: ...임. (없으면 '해당 정보 없음')"
}`;

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "POST만 허용" }, { status: 405, headers: corsHeaders });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY 환경변수가 없습니다. Vercel > Settings > Environment Variables에 추가하세요." }, { status: 500, headers: corsHeaders });
  }

  let body: { text?: string; type?: string; seq?: number; extra?: string };
  try { body = await req.json(); } catch {
    return Response.json({ error: "요청 본문 파싱 실패" }, { status: 400, headers: corsHeaders });
  }

  const { text = "", type = "RCT", seq = 1, extra = "" } = body;
  if (!text.trim()) return Response.json({ error: "논문 내용을 입력해주세요." }, { status: 400, headers: corsHeaders });

  // Gemini 스트리밍 API 호출 (streamGenerateContent + alt=sse)
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

  let geminiResp: Response;
  try {
    geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: JSON_PROMPT_TEMPLATE(text, type, seq, extra) }] }],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 8192,
          // 스키마 없이 프롬프트 기반 JSON → 훨씬 빠름
        },
      }),
    });
  } catch (e: any) {
    return Response.json({ error: `Gemini 연결 실패: ${e.message}` }, { status: 502, headers: corsHeaders });
  }

  if (!geminiResp.ok) {
    const errText = await geminiResp.text();
    let msg = `Gemini API 오류 (${geminiResp.status})`;
    try { msg = JSON.parse(errText)?.error?.message || msg; } catch {}
    if (geminiResp.status === 400 || geminiResp.status === 403) msg = `API 키 오류: ${msg}`;
    return Response.json({ error: msg }, { status: geminiResp.status, headers: corsHeaders });
  }

  // Gemini SSE 스트림을 클라이언트에 그대로 파이프
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = geminiResp.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(enc.encode("data: [DONE]\n\n"));
            controller.close();
            break;
          }
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const parsed = JSON.parse(raw);
              const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              if (chunk) {
                // 클라이언트로 텍스트 청크만 전달
                controller.enqueue(enc.encode(`data: ${JSON.stringify({ t: chunk })}\n\n`));
              }
            } catch { /* 파싱 실패 청크 무시 */ }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no", // nginx 프록시 버퍼링 비활성화
    },
  });
}
