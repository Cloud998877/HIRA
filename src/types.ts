export interface TableData {
  title: string;       // 표 번호 및 제목 (예: "Table 1. Baseline Characteristics")
  headers: string[];   // 컬럼 헤더
  rows: string[][];    // 데이터 행
  footnote?: string;   // 각주
}

export interface FigureData {
  label: string;       // 그림 번호 (예: "Figure 1")
  title: string;       // 그림 제목
  description: string; // 그림 내용 설명 (AI 요약)
  keyFindings: string; // 핵심 수치·결론
}

export interface LiteratureSummary {
  title: string;
  citation: string;
  countries: string;
  authors: string;
  affiliation: string;
  objective: string;
  inclusion: string;
  exclusion: string;
  studyPeriod: string;
  studyDesign: string;
  statisticalMethods: string;
  intervention: string;
  control: string;
  primaryEndpoint: string;
  secondaryEndpoints: string;
  patientCharacteristics: string;
  dropout: string;
  results: string;
  conclusion: string;
  limitations: string;
  sponsor: string;
  sensitivityAnalysis: string;
  researcherPerspective: string;
  keyTables?: TableData[];   // 논문 주요 표 재현
  keyFigures?: FigureData[]; // 논문 주요 그림 설명
}

export interface SavedLiterature {
  id: string;
  seq: number;
  type: string;
  uploadedAt: string;
  fileName?: string;
  inputText: string;
  summary: LiteratureSummary;
}
