import React from "react";
import { Copy, Printer, Download, FileText, Check } from "lucide-react";
import { LiteratureSummary } from "../types";

interface SummaryTableProps {
  seq: number;
  type: string;
  summary: LiteratureSummary;
  onDownloadHTML: () => void;
  onPrint: () => void;
}

export default function SummaryTable({
  seq,
  type,
  summary,
  onDownloadHTML,
  onPrint,
}: SummaryTableProps) {
  const [copied, setCopied] = React.useState(false);

  const typeMap: Record<string, string> = {
    RCT: "☑ Randomized controlled trial (RCT)",
    cohort: "☑ Case-control or cohort studies",
    single: "☑ Single arm study",
    case: "☑ Case report or case series",
    other: "☑ 기타",
  };

  const formattedType = typeMap[type] || `☑ ${type}`;

  // Simple react-compatible inline markdown bold & italic renderer
  const parseInlineMarkdown = (rawText: string): React.ReactNode => {
    if (!rawText) return "";
    
    const boldParts = rawText.split(/\*\*([\s\S]*?)\*\*/g);
    return (
      <>
        {boldParts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <strong key={index} className="font-extrabold text-[#0f172a] pr-0.5">
                {part}
              </strong>
            );
          }
          const italicParts = part.split(/\*([\s\S]*?)\*/g);
          return (
            <React.Fragment key={index}>
              {italicParts.map((item, subIndex) => {
                if (subIndex % 2 === 1) {
                  return (
                    <em key={subIndex} className="italic text-[#334155]">
                      {item}
                    </em>
                  );
                }
                return item;
              })}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  // Converts markdown to clean HTML for document download/copy contexts
  const markdownToHtml = (rawText: string) => {
    if (!rawText) return "해당 정보 없음";
    
    return rawText
      .split("\n")
      .map(line => {
        let trimmed = line.trim();
        if (!trimmed) return "";
        
        const listMatch = trimmed.match(/^([-*•○▪▫]|\d+\)|[a-zA-Z]\)|[ivxIVX]+\.|\d+\.|\*)\s+(.*)$/);
        if (listMatch) {
          const [, bullet, rest] = listMatch;
          let content = rest;
          const colonIndex = content.indexOf(":");
          if (colonIndex > 0 && colonIndex < 40 && !content.slice(0, colonIndex).includes("http")) {
            const key = content.slice(0, colonIndex).trim().replace(/^\*\*|\*\*$/g, '');
            const val = content.slice(colonIndex + 1).trim();
            content = `<b>${key}</b>: ${val}`;
          }
          content = content.replace(/\*\*([\s\S]*?)\*\*/g, "<b>$1</b>");
          content = content.replace(/\*([\s\S]*?)\*/g, "<i>$1</i>");
          return `<div style="margin-left: 15px; margin-bottom: 4px; line-height: 1.5; font-size: 10pt;">• ${content}</div>`;
        }
        
        const colonIndex = trimmed.indexOf(":");
        if (colonIndex > 0 && colonIndex < 40 && !trimmed.slice(0, colonIndex).includes("http")) {
          const key = trimmed.slice(0, colonIndex).trim().replace(/^\*\*|\*\*$/g, '');
          const val = trimmed.slice(colonIndex + 1).trim();
          let content = `<b>${key}</b>: ${val}`;
          content = content.replace(/\*\*([\s\S]*?)\*\*/g, "<b>$1</b>");
          content = content.replace(/\*([\s\S]*?)\*/g, "<i>$1</i>");
          return `<div style="margin-bottom: 6px; border-left: 2px solid #2B6CB0; padding-left: 8px; line-height: 1.5; font-size: 10pt;">${content}</div>`;
        }
        
        let content = trimmed.replace(/\*\*([\s\S]*?)\*\*/g, "<b>$1</b>");
        content = content.replace(/\*([\s\S]*?)\*/g, "<i>$1</i>");
        return `<div style="margin-bottom: 4px; line-height: 1.5; font-size: 10pt;">${content}</div>`;
      })
      .filter(line => line !== "")
      .join("");
  };

  const handleDownloadWord = () => {
    const tableElement = document.getElementById("hira-submission-table");
    if (!tableElement) return;

    // Create self-contained MHTML/HTML Word document payload with precise inline styles
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>HIRA 표6 제출논문 요약표 - ${summary.title}</title>
        <style>
          @page {
            size: A4;
            margin: 1in;
          }
          body {
            font-family: 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #2D3748;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 2px solid #1A365D;
          }
          caption {
            font-size: 13.5pt;
            font-weight: bold;
            text-align: left;
            padding: 12px;
            background-color: #1A365D;
            color: #FFFFFF;
            margin: 0;
          }
          th {
            background-color: #EBF8FF;
            color: #2B6CB0;
            font-weight: bold;
            padding: 10px 12px;
            text-align: left;
            width: 160px;
            vertical-align: top;
            border: 1px solid #CBD5E0;
          }
          td {
            padding: 10px 12px;
            vertical-align: top;
            border: 1px solid #CBD5E0;
            line-height: 1.6;
            color: #2D3748;
          }
          .section-title-row td {
            background-color: #E2E8F0;
            font-weight: bold;
            color: #1A365D;
            text-align: center;
            padding: 8px 12px;
            border-top: 1.5px solid #1A365D;
            border-bottom: 1.5px solid #1A365D;
          }
          span.block {
            display: block;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; color: #1A365D; font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; margin-bottom: 5px;">의학 신약 청구자료 - 표6 제출논문 요약표</h2>
        <p style="text-align: right; font-size: 9pt; color: #718096; margin-bottom: 25px;">HIRA-GPT 자동 편찬 플랫폼 가공작업 완료본</p>
        
        <table style="width: 100%; border-collapse: collapse; border: 2px solid #1A365D;">
          <caption style="background-color: #1A365D; color: #FFFFFF; font-weight: bold; padding: 12px; text-align: left; font-size: 14pt;">🏆 표 제출논문 요약표 (표6서식)</caption>
          <tbody>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">연번</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">${seq}</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">내용 구분</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0; font-weight: bold;">${formattedType}</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">제목</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0; font-weight: bold;">${summary.title}</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">출전</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">${summary.citation}</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">시험 참여국가</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">${summary.countries}</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">저자, 소속기관명</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">
                <b>○ 저자:</b> ${summary.authors}<br/><br/>
                <b>○ 소속기관:</b> ${summary.affiliation}
              </td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">시험목적</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">${markdownToHtml(summary.objective)}</td>
            </tr>
            <tr class="section-title-row" style="background-color: #E2E8F0; font-weight: bold; color: #1A365D; text-align: center;">
              <td colSpan="2" style="background-color: #E2E8F0; font-weight: bold; color: #1A365D; text-align: center; padding: 8px 12px; border: 1px solid #CBD5E0;">연구 방법</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">대상환자 선정기준</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">
                <b>○ 포함 기준(Inclusion Criteria):</b><br/>
                ${markdownToHtml(summary.inclusion)}<br/><br/>
                <b>○ 제외 기준(Exclusion Criteria):</b><br/>
                ${markdownToHtml(summary.exclusion)}
              </td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">시험기간</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">${markdownToHtml(summary.studyPeriod)}</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">시험설계</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">${markdownToHtml(summary.studyDesign)}</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">중재형태</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">
                <b>○ 시험군 (Intervention group):</b><br/>
                ${markdownToHtml(summary.intervention)}<br/><br/>
                <b>○ 대조군 (Control group):</b><br/>
                ${markdownToHtml(summary.control)}
              </td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">평가항목</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">
                <b>○ 1차 평가변수:</b><br/>
                ${markdownToHtml(summary.primaryEndpoint)}<br/><br/>
                <b>○ 2차 평가변수 및 그 외:</b><br/>
                ${markdownToHtml(summary.secondaryEndpoints)}
              </td>
            </tr>
            <tr class="section-title-row" style="background-color: #E2E8F0; font-weight: bold; color: #1A365D; text-align: center;">
              <td colSpan="2" style="background-color: #E2E8F0; font-weight: bold; color: #1A365D; text-align: center; padding: 8px 12px; border: 1px solid #CBD5E0;">연구 결과</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">피험자 특성</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">
                <b>○ 피험자 기저상태 비교:</b><br/>
                ${markdownToHtml(summary.patientCharacteristics)}<br/><br/>
                <b>○ 중도탈락 현황 (Dropout Flow-chart):</b><br/>
                ${markdownToHtml(summary.dropout)}
              </td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">시험결과</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">${markdownToHtml(summary.results)}</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">결론</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;"><b>${markdownToHtml(summary.conclusion)}</b></td>
            </tr>
            <tr class="section-title-row" style="background-color: #E2E8F0; font-weight: bold; color: #1A365D; text-align: center;">
              <td colSpan="2" style="background-color: #E2E8F0; font-weight: bold; color: #1A365D; text-align: center; padding: 8px 12px; border: 1px solid #CBD5E0;">기타 정보</td>
            </tr>
            <tr>
              <th style="background-color: #EBF8FF; color: #2B6CB0; font-weight: bold; padding: 10px 12px; font-size: 11px; width: 150px; border: 1px solid #CBD5E0; text-align: left;">기타</th>
              <td style="padding: 10px 12px; border: 1px solid #CBD5E0;">
                <b>○ 연구의 한계 (Limitations):</b><br/>
                ${markdownToHtml(summary.limitations)}<br/><br/>
                <b>○ 후원기관 (Sponsor):</b><br/>
                ${markdownToHtml(summary.sponsor)}<br/><br/>
                <b>○ 민감도 분석 (Sensitivity analysis):</b><br/>
                ${markdownToHtml(summary.sensitivityAnalysis)}<br/><br/>
                <b>○ 연구자 추가 관점:</b><br/>
                ${markdownToHtml(summary.researcherPerspective)}
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const cleanTitle = summary.title.replace(/[^a-zA-Z0-9가-힣\s]/g, "").slice(0, 20).trim() || "임상문헌요약표";
    link.href = url;
    link.download = `[심평원제출_표6]_${cleanTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const doCopy = async () => {
    const tableElement = document.getElementById("hira-submission-table");
    if (!tableElement) return;

    try {
      // Elegant rich text copy supporting Word formatting
      const range = document.createRange();
      range.selectNode(tableElement);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        selection.removeAllRanges();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy table: ", err);
    }
  };

  // Smart text parser that turns key-value and custom bullet points into structured submission layouts
  const renderLines = (text: string) => {
    if (!text) return <span className="text-gray-400 font-normal">해당 정보 없음</span>;
    
    // Normalizing text output (preventing blank lines or repeated bullet clutter)
    const rawLines = text.split("\n");
    const formattedNodes: React.ReactNode[] = [];
    
    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        formattedNodes.push(<div key={`blank-${idx}`} className="h-1.5" />);
        return;
      }

      // Check indentation depth based on leading spaces to render nested items beautifully
      const indentCount = line.length - line.trimStart().length;
      let indentClass = "pl-0";
      if (indentCount >= 7) {
        indentClass = "pl-10";
      } else if (indentCount >= 4) {
        indentClass = "pl-7";
      } else if (indentCount >= 2) {
        indentClass = "pl-4";
      }

      // List prefix matching for list elements like: "- ", "* ", "○ ", "• ", "1)", "i)", "A)", etc.
      const listMatch = trimmed.match(/^([-*•○▪▫]|\d+\)|[a-zA-Z]\)|[ivxIVX]+\.|\d+\.|\*)\s+(.*)$/);
      
      let contentNode: React.ReactNode;

      if (listMatch) {
        const [, bullet, rest] = listMatch;
        const bulletChar = bullet.endsWith('.') && bullet.length > 2 ? bullet : bullet;
        
        // Key-Value splitting within list items (e.g., "- mPFS: 25.3개월")
        const colonIndex = rest.indexOf(":");
        if (colonIndex > 0 && colonIndex < 40 && !rest.slice(0, colonIndex).includes("http")) {
          let key = rest.slice(0, colonIndex).trim();
          const val = rest.slice(colonIndex + 1).trim();
          
          key = key.replace(/^\*\*|\*\*$/g, '');
          
          contentNode = (
            <div className="flex gap-2 items-start text-slate-700 leading-normal">
              <span className="text-blue-800 font-bold shrink-0 inline-block text-right min-w-[20px] select-none text-[13px]">{bulletChar}</span>
              <div className="flex-1 text-[13px] leading-relaxed">
                <span className="font-bold text-slate-900 mr-1.5">{parseInlineMarkdown(key)}:</span>
                <span className="text-slate-800 font-medium">{parseInlineMarkdown(val)}</span>
              </div>
            </div>
          );
        } else {
          contentNode = (
            <div className="flex gap-2 items-start text-slate-700 leading-normal">
              <span className="text-blue-800 font-bold shrink-0 inline-block text-right min-w-[20px] select-none text-[13px]">{bulletChar}</span>
              <span className="flex-1 text-[13px] text-slate-800 leading-relaxed font-semibold">{parseInlineMarkdown(rest)}</span>
            </div>
          );
        }
      } else {
        // Checking key-value matching for non-list lines or header-like labels
        const colonIndex = trimmed.indexOf(":");
        if (colonIndex > 0 && colonIndex < 40 && !trimmed.slice(0, colonIndex).includes("http")) {
          let key = trimmed.slice(0, colonIndex).trim();
          const val = trimmed.slice(colonIndex + 1).trim();
          
          key = key.replace(/^\*\*|\*\*$/g, '');
          
          contentNode = (
            <div className="text-slate-800 py-1 border-l-2 border-blue-400 pl-3 my-1 bg-slate-50/50 rounded mr-0">
              <span className="font-bold text-slate-900 mr-2 text-[13px]">{parseInlineMarkdown(key)}:</span>
              <span className="text-[13px] text-slate-700 leading-relaxed font-semibold">{parseInlineMarkdown(val)}</span>
            </div>
          );
        } else {
          // Normal line
          contentNode = (
            <span className="text-slate-750 text-[13px] leading-relaxed font-semibold block my-0.5">
              {parseInlineMarkdown(trimmed)}
            </span>
          );
        }
      }

      formattedNodes.push(
        <div key={idx} className={`${indentClass} my-1 hover:bg-blue-50/20 transition-colors rounded px-1`}>
          {contentNode}
        </div>
      );
    });

    return <div className="space-y-0.5">{formattedNodes}</div>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Header Controls */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Table 6 Form
          </div>
          <span className="text-sm text-slate-500 font-medium font-bold text-slate-700">제출용 임상문헌 구조화 가공본</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={doCopy}
            className="inline-flex items-center gap-1.5 bg-white text-slate-700 hover:text-slate-950 border border-slate-300 hover:border-slate-400 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors active:bg-slate-50"
            title="의학 논문 요약표 전체 복사 (MS Word, 한컴오피스 등 한글 프로그램에 원형 복사 붙여넣기 기능 최적화)"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>클립보드 표 전체 복사</span>
              </>
            )}
          </button>

          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 bg-white text-slate-700 hover:text-slate-950 border border-slate-300 hover:border-slate-400 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors active:bg-slate-50"
            title="웹 브라우저의 인쇄 대화 상자를 띄워 인쇄하거나 PDF로 즉시 저장합니다."
          >
            <Printer className="w-3.5 h-3.5" />
            <span>화면 인쇄 / PDF 출력</span>
          </button>

          <button
            onClick={handleDownloadWord}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors active:bg-emerald-800 shadow-sm"
            title="심평원 제출 규격 테이블 레이아웃을 그대로 보존하는 MS Word(.doc) 문서를 내보냅니다."
          >
            <FileText className="w-3.5 h-3.5" />
            <span>MS Word (.doc) 다운로드</span>
          </button>

          <button
            onClick={onDownloadHTML}
            className="inline-flex items-center gap-1.5 bg-slate-600 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors active:bg-slate-800 shadow-sm"
            title="독립 실행이 가능한 HTML 웹 소스 파일로 내보내어 디스크에 영구 백업 보관합니다."
          >
            <Download className="w-3.5 h-3.5" />
            <span>HTML 원본 보관</span>
          </button>
        </div>
      </div>

      {/* Dynamic Sandbox Protection Warning Banner */}
      <div className="bg-amber-50 border-b border-slate-100 px-6 py-3.5 text-[11.5px] text-amber-800 leading-relaxed border-l-4 border-amber-550 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase shrink-0 mt-0.5 tracking-wider">
            인쇄 및 저장 문제해결 가이드
          </span>
          <p className="m-0 text-slate-700">
            현재 인쇄가 되지 않는 것은 개발 샌드박스 내부의 <strong>브라우저 보안 프레임(iframe) 정책</strong> 때문입니다. 
            상단의 <strong>[MS Word (.doc) 다운로드]</strong> 버튼으로 완벽한 서식의 문서를 내보내어 실행하시거나, 
            <strong>[클립보드 표 전체 복사]</strong>를 클릭해 보유 중인 에디터(한컴 한글 HWP, MS Word)에 직접 
            붙여넣으면(<kbd className="bg-amber-100 border border-amber-300 px-1 py-0.2 rounded font-mono text-[10px]">Ctrl + V</kbd>) 한결 높은 효율로 즉시 인쇄 및 추가 작업이 가능합니다!
          </p>
        </div>
      </div>

      {/* Styled Table Sheet Wrapper */}
      <div className="p-6 md:p-8 overflow-x-auto bg-slate-50/50">
        <div className="inline-block min-w-full align-middle">
          <div id="hira-submission-table" className="bg-white p-6 shadow-md border border-slate-200 rounded-md max-w-4xl mx-auto font-sans text-slate-900 leading-relaxed">
            {/* Embedded internal CSS for clean MS Word pasting capability */}
            <span style={{ display: "none" }}>
              <style dangerouslySetInnerHTML={{ __html: `
                #hira-submission-table table {
                  width: 100%;
                  border-collapse: collapse;
                  font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
                  font-size: 13px;
                  color: #2D3748;
                  border: 2px solid #1A365D;
                }
                #hira-submission-table caption {
                  font-size: 15px;
                  font-weight: bold;
                  text-align: left;
                  padding: 12px;
                  background-color: #1A365D;
                  color: #FFFFFF;
                  margin: 0;
                }
                #hira-submission-table th {
                  background-color: #EBF8FF;
                  color: #2B6CB0;
                  font-weight: bold;
                  padding: 10px 14px;
                  text-align: left;
                  width: 170px;
                  vertical-align: top;
                  border: 1px solid #CBD5E0;
                  font-size: 12px;
                }
                #hira-submission-table td {
                  padding: 10px 14px;
                  vertical-align: top;
                  border: 1px solid #CBD5E0;
                  line-height: 1.6;
                }
                #hira-submission-table tr.section-title-row td {
                  background-color: #E2E8F0;
                  font-weight: bold;
                  color: #1A365D;
                  font-size: 12.5px;
                  letter-spacing: 0.05em;
                  padding: 6px 14px;
                  border-top: 1.5px solid #1A365D;
                  border-bottom: 1.5px solid #1A365D;
                }
                #hira-submission-table .item-title {
                  font-weight: bold;
                  color: #2D3748;
                  margin-top: 8px;
                  margin-bottom: 4px;
                }
                #hira-submission-table .item-title:first-child {
                  margin-top: 0;
                }
                #hira-submission-table .item-sub-content {
                  margin-left: 4px;
                  color: #4A5568;
                }
              `}} />
            </span>

            <table className="w-full border-collapse border-2 border-blue-900 text-sm">
              <caption className="bg-blue-900 text-white text-base font-bold text-left p-3.5 tracking-wide">
                🏆 표 제출논문 요약표 (표6서식)
              </caption>
              <tbody>
                {/* Basic Details */}
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    연번
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-800 font-medium">
                    {seq}
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    내용 구분
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-800 font-semibold text-blue-900">
                    {formattedType}
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    제목
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-800 font-semibold text-[13.5px] leading-relaxed">
                    {summary.title}
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    출전
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-700 font-mono text-[12.5px]">
                    {summary.citation}
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    시험 참여국가
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-800">
                    {summary.countries}
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    저자, 소속기관명
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-800 text-[13px]">
                    <div className="font-bold text-slate-900 mb-1">○ 저자</div>
                    <div className="pl-2 mb-3 text-slate-700">{summary.authors}</div>
                    <div className="font-bold text-slate-900 mb-1">○ 소속기관</div>
                    <div className="pl-2 text-slate-700">{summary.affiliation}</div>
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    시험목적
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-800 leading-relaxed text-[13px]">
                    {renderLines(summary.objective)}
                  </td>
                </tr>

                {/* Sub-header: 연구 방법 */}
                <tr className="section-title-row">
                  <td colSpan={2} className="bg-slate-200 font-bold text-blue-900 text-xs py-2 px-3 border border-slate-300 tracking-widest uppercase text-center bg-zinc-100">
                    연구 방법
                  </td>
                </tr>

                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    대상환자<br />선정기준
                  </th>
                  <td className="p-3 border border-slate-300 text-[13px]">
                    <div className="font-bold text-slate-900 mb-1">○ 포함 기준(Inclusion)</div>
                    <div className="pl-2 mb-4 text-slate-700 space-y-1">{renderLines(summary.inclusion)}</div>
                    
                    <div className="font-bold text-slate-900 mb-1">○ 제외 기준(Exclusion)</div>
                    <div className="pl-2 text-slate-700 space-y-1">{renderLines(summary.exclusion)}</div>
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    시험기간
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-700 text-[13px] leading-relaxed">
                    {renderLines(summary.studyPeriod)}
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    시험설계
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-800 text-[13px] leading-relaxed">
                    {renderLines(summary.studyDesign)}
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    중재형태
                  </th>
                  <td className="p-3 border border-slate-300 text-[13px]">
                    <div className="font-bold text-indigo-900 mb-1">○ 시험군 (Intervention Group)</div>
                    <div className="pl-2 mb-4 text-slate-700 leading-relaxed">{renderLines(summary.intervention)}</div>
                    
                    <div className="font-bold text-slate-800 mb-1">○ 대조군 (Control Group)</div>
                    <div className="pl-2 text-slate-700 leading-relaxed">{renderLines(summary.control)}</div>
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    평가항목
                  </th>
                  <td className="p-3 border border-slate-300 text-[13px]">
                    <div className="font-bold text-slate-900 mb-1">○ 1차 평가변수(Primary Endpoint)</div>
                    <div className="pl-2 mb-3 text-slate-700">{renderLines(summary.primaryEndpoint)}</div>
                    
                    <div className="font-bold text-slate-950 mb-1">○ 2차 평가변수 및 그 외 평가사항</div>
                    <div className="pl-2 text-slate-700 leading-relaxed">{renderLines(summary.secondaryEndpoints)}</div>
                  </td>
                </tr>

                {/* Sub-header: 연구 결과 */}
                <tr className="section-title-row">
                  <td colSpan={2} className="bg-slate-200 font-bold text-blue-900 text-xs py-2 px-3 border border-slate-300 tracking-widest uppercase text-center bg-zinc-100">
                    연구 결과
                  </td>
                </tr>

                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    피험자 특성
                  </th>
                  <td className="p-3 border border-slate-300 text-[13px]">
                    <div className="font-bold text-slate-900 mb-1.5">○ 피험자 기저상태 비교</div>
                    <div className="pl-2 mb-4 text-slate-700 leading-relaxed space-y-1">
                      {renderLines(summary.patientCharacteristics)}
                    </div>
                    
                    <div className="font-bold text-slate-900 mb-1">○ 중도탈락 현황 (Dropout)</div>
                    <div className="pl-2 text-slate-700 leading-relaxed">
                      {renderLines(summary.dropout)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    시험결과
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-800 text-[13px] leading-relaxed">
                    {renderLines(summary.results)}
                  </td>
                </tr>
                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    결론
                  </th>
                  <td className="p-3 border border-slate-300 text-slate-900 font-medium text-[13px] leading-relaxed">
                    {renderLines(summary.conclusion)}
                  </td>
                </tr>

                {/* Sub-header: 기타 정보 */}
                <tr className="section-title-row">
                  <td colSpan={2} className="bg-slate-200 font-bold text-blue-900 text-xs py-2 px-3 border border-slate-300 tracking-widest uppercase text-center bg-zinc-100">
                    기타 정보
                  </td>
                </tr>

                <tr>
                  <th className="bg-blue-50 text-blue-800 font-bold p-3 border border-slate-300 w-[170px] text-left align-top text-xs tracking-wider">
                    기타
                  </th>
                  <td className="p-3 border border-slate-300 text-[13px]">
                    <div className="font-bold text-slate-900 mb-1">○ 연구의 한계 (Limitations)</div>
                    <div className="pl-2 mb-3 text-slate-700 leading-relaxed">{renderLines(summary.limitations)}</div>
                    
                    <div className="font-bold text-slate-900 mb-1">○ 후원기관/자금지원 (Sponsor)</div>
                    <div className="pl-2 mb-3 text-slate-700">{renderLines(summary.sponsor)}</div>

                    <div className="font-bold text-slate-900 mb-1">○ 민감도 분석 (Sensitivity Analysis)</div>
                    <div className="pl-2 mb-3 text-slate-700 leading-relaxed">{renderLines(summary.sensitivityAnalysis)}</div>

                    <div className="font-bold text-slate-900 mb-1">○ 연구자 추가 관점 및 가치 (Researcher Perspective)</div>
                    <div className="pl-2 text-slate-700 leading-relaxed">{renderLines(summary.researcherPerspective)}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
