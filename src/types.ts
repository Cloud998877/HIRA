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
