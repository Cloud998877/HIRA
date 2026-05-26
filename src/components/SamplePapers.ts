export interface SamplePaper {
  id: string;
  title: string;
  type: string;
  shortDesc: string;
  text: string;
}

export const SAMPLE_PAPERS: SamplePaper[] = [
  {
    id: "cepheus",
    title: "CEPHEUS Phase 3 Trial (D-VRd vs VRd in NDMM) - 한글 기재 및 수치 완벽본",
    type: "RCT",
    shortDesc: "다발성 골수종 신환 대상 Daratumumab 4제요법 (심평원 기재 가이드에 최적화)",
    text: `[임상시험 상세 정보 및 원문 데이터셋]
Title: Daratumumab plus bortezomib, lenalidomide and dexamethasone for transplant-ineligible or transplant-deferred newly diagnosed multiple myeloma: the randomized phase 3 CEPHEUS trial.

출전/Citation: Usmani SZ, Facon T, Hungria V, et al. Nature medicine. 2025;31(4):1195-1202. (NCT03652064)
시험 참여국가: 브라질, 캐나다, 체코, 프랑스, 독일, 이스라엘, 일본, 대한민국, 네덜란드, 폴란드, 스페인, 튀르키예, 영국, 미국

○ 시험목적
자가조혈모세포 이식이 부적합하거나 이식을 연기한 새롭게 진단된 다발골수종 환자(NDMM)에서 기존 표준 치료법인 Bortezomib + Lenalidomide + dexamethasone (VRd 삼제요법) 대비 Daratumumab SC + Bortezomib + Lenalidomide + dexamethasone (DVRd 사제요법)의 유효성 및 안전성을 대조 평가하기 위함.

○ 대상환자 포함 기준 (Inclusion Criteria)
1) 새롭게 진단된 다발골수종 환자 (Newly Diagnosed Multiple Myeloma, NDMM)
2) 80세 미만의 성인 환자
3) ECOG performance status가 0~2점인 환자
4) Frailty index가 2점 미만(Fit 또는 Intermediate)인 환자
5) 다음 중 최소 한 가지 요건에 만족하는 환자:
   - 70세 이상이며, 고용량 항암요법을 동반한 자가조혈모세포 이식이 부적합한 경우
   - 18~70세이며, 고용량 항암요법을 동반한 자가조혈모세포 이식이 부적합한 경우
   - 18~70세이며, 고용량 항암요법을 동반한 자가조혈모세포 이식을 연기한 경우
6) 절대 호중구(Neutrophil) 수가 1.0 X 10^9/L 이상인 환자 (G-CSF 사용은 기준 충족을 위해 허용됨)
7) 헤모글로빈(Hemoglobin) 수치가 7.5g/dL 이상인 환자 (단, 검사 전 7일 이내에 적혈구 수혈이 없어야 하며, 에리스로포이에틴은 투여 가능)
8) 혈소판(Platelet) 수치가 다음에 해당하는 환자:
   - 골수 내 유핵세포(Nucleated cell) 중 형질세포가 50% 미만인 경우: 70 X 10^9/L 이상
   - 골수 내 유핵세포 중 형질세포가 50% 이상인 경우: 50 X 10^9/L 초과
9) 크레아티닌 제거율(CrCl)이 30 mL/min 이상인 환자
10) 보정 혈청 칼슘 수치가 13.5 mg/dL (3.4 mmol/L) 이하이거나 유리 이온화 칼슘이 6.5 mg/dL (1.6 mmol/L) 이하인 환자
11) AST 및 ALT 수치가 정상 상한치(ULN)의 2.5배 이하인 환자
12) 총 빌리루빈(Bilirubin) 수치가 정상 상한치의 1.5배 이하인 환자

○ 대상환자 제외 기준 (Exclusion Criteria)
1) 이전에 다발골수종에 대한 전신 치료를 받은 이력이 있는 환자 (단, 진단 확인용 단기간의 코르티코스테로이드 투여는 허용)
2) 무작위배정 시점 기준, 5년 이내에 다발골수종 외의 침습성 악성종양이 존재했거나 현재 동반되어 있는 경우
3) 2등급 이상의 말초신경병증(Peripheral Neuropathy) 또는 신경병증성 통증 환자 (NCI-CTCAE v5 기준)
4) 무작위배정 시점 기준, 14일 이내에 국소 방사선치료를 받은 환자
5) 무작위배정 시점 기준, 28일 이내에 임상적 목적으로 혈장교환술(Plasmapheresis)을 시행한 환자
6) 뇌수막(Meningeal) 침범의 임상적 활동성 징후가 있는 환자
7) 만성 폐쇄성 폐질환 (COPD) 환자 또는 1초간 강제호기량(FEV1)이 정상 예측치의 50% 미만인 환자
8) 최근 2년 이내에 중등도 또는 중증의 지속성 천식이 있거나 현재 조절되지 않는 천식 질환경력이 있는 환자

○ 시험기간 및 핵심 일정
- 환자 등록 기간: 2018.12.11 ~ 2019.10.07
- 추적 관찰 기간 (중앙값/Median follow-up): 58.7개월 (범위 0.1 ~ 64.7개월)
- 핵심 자료 수집 원본 완료일 (Data Cutoff, DCO): 2024.05.07

○ 시험 설계 (Study Design)
- 공개(Open-label), 다국가, 다기관, 무작위배정(Randomized), 3상 임상시험
- 환자들은 DVRd군과 VRd군에 1:1 비율로 무작위배정되었음 (DVRd N=197명, VRd N=198명 배정)
- 배정 층화 기준: ISS disease stage (I, II, III 단계), 연령 및 이식 적합 여부 유무

○ 구체적 중재 투여 요약 (Intervention Details)
1) DVRd 요법 (N=197):
   - 1~2주기 (21-day cycle): Daratumumab SC 1,800mg (2,000U/mL 재조합 인간 히알루로니다제 배합) 매주 피하주사. bortezomib 1.3 mg/m2 SC 주기의 1, 4, 8, 11일 투여. lenalidomide 25mg PO 주기의 1~14일 투여. dexamethasone 20mg 주기의 1,2,4,5,8,9,11,12일 투여 (단, 75세 초과 또는 BMI 18.5 미만 시 1, 4, 8, 11일에만 투여)
   - 3~8주기 (21-day cycle): Daratumumab SC 1,800mg 3주에 1회 피하주사. bortezomib, lenalidomide, dexamethasone 요법 동일 유지.
   - 9주기 이후 (28-day cycle): Daratumumab SC 1,800mg 4주에 1회 피하주사. lenalidomide 25mg PO 주기의 1~21일 투여. dexamethasone 40mg 주기의 1, 8, 15, 22일 투여 (75세 초과 혹은 저체중 BMI 18.5 미만인 경우 dexamethasone 20mg으로 제한 감량)
2) VRd 요법 (N=198):
   - 1~8주기 (21-day cycle): bortezomib 1.3 mg/m2 SC (주기별 1, 4, 8, 11일), lenalidomide 25mg PO (주기별 1~14일), dexamethasone 20mg (주기별 1, 2, 4, 5, 8, 9, 11, 12일 투여)
   - 9주기 이후 (28-day cycle): lenalidomide 25mg PO (주기별 1~21일), dexamethasone 40mg (주기별 1, 8, 15, 22일 투여; 고령/저체중 대상자는 20mg으로 조정)

○ 평가목적 변수 (Endpoints)
- 1차 평가변수: 전체 MRD 음성률 (overall MRD-negativity rate, 민감도 기준치 10^-5 차세대염기서열분석 clonoSEQ 기준 및 CR 이상 도달 비율)
- 2차 평가변수: 지속 및 10^-6 수준의 MRD 음성률, 무진행 생존기간(PFS), CR 이상 비율 (Complete Response or better rate), 전체 생존기간(Overall Survival, OS), 치료 관련 이상반응(TEAE)

○ 피험자 기저 특성 분율 비교 (DVRd vs VRd)
- 환자수: DVRd 197명 vs VRd 198명 무작위배정
- 연령 중앙값: DVRd 70세(42~79) vs VRd 70세(31~80)
- 연령 분포 (>= 70세): DVRd 109명(55.3%) vs VRd 110명(55.6%)
- 성별 남성비율: DVRd 87명(44.2%) vs VRd 111명(56.1%)
- 인종 (동양인/Asian): DVRd 11명(5.6%) vs VRd 14명(7.1%)
- ECOG 점수: ECOG 0 일치 비율 DVRd 71명(36.0%) vs VRd 84명(42.4%), ECOG 1 비율 DVRd 103명(52.3%) vs VRd 100명(50.5%)
- Frailty Score = 0 (Fit): DVRd 124명(62.9%) vs VRd 132명(66.7%)
- 다발골수종 면역글로불린 검출 (IgG형): DVRd 89명(45.2%) vs VRd 76명(38.4%)
- ISS 병기 등급 III 비율: DVRd 56명(28.4%) vs VRd 55명(27.8%)
- 세포유전학 고위험군 비율 (High-risk Cytogenetics): DVRd 25명(12.7%) vs VRd 27명(13.6%)
- 다발골수종 진단 후 경과 기간(중앙값): DVRd 1.2개월 vs VRd 1.3개월

○ 환자 중도탈락(Dropout) 현황
- 스크리닝 임상 등록 환자수 508명 중 무작위배정 대상자 395명 (113명은 스크리닝 실패로 제외)
- DVRd 요법군 (N=197): 실제 치료군 197명 투여 진행. 치료 중단 환자는 총 95명이며, 주원인은 질병 진행 27명, 이상반응 16명, 사망 34명(이 중 COVID-19 사망이 15명), 환자 자의적 중단 15명, 의사 판단 중단 3명임. 데이터 컷오프 시점 치료 지속 환자수 102명(51.8%)
- VRd 요법군 (N=198): 실제 치료군 195명 투여 진행(3명 비투여). 치료 중단 환자는 총 128명이며, 주원인은 질병 진행 51명, 이상반응 32명, 사망 24명(이 중 COVID-19 사망이 9명), 환자 자의적 중단 13명, 의사 판단 중단 12명, 타 치료 전환 1명임. 데이터 컷오프 시점 치료 지속 환자수 67명(33.8%)

○ 임상시험 주요 결과 (Efficacy & Safety Outcomes)
1) 1차 유효성 평가 결과 (MRD 음성률, 10^-5):
   - DVRd군: 60.9% (120명) vs VRd군: 39.4% (78명)
   - Odds Ratio 2.37 (95% CI 1.58 - 3.55), P값 <0.0001 (명확히 통계적 유의성 입증됨)
2) 주요 2차 유효성 평가 결과:
   - MRD 음성률 (10^-6): DVRd군 46.2% vs VRd군 27.3% (Odds Ratio 2.24, P=0.0001)
   - 지속형 MRD 음성률 (>= 12개월 유지): DVRd군 48.7% vs VRd군 26.3% (Odds Ratio 2.63, P<0.0001)
   - 무진행 생존기간 (PFS): DVRd군 mPFS 도달하지 않음(NR) vs VRd군 mPFS 52.6개월.
     위험비 (Hazard Ratio) 0.57 (95% CI 0.41 - 0.79), P값 = 0.0005 (DVRd 군의 질병 진행 위험이 43% 유의하게 감소함)
     54개월 시점 생존율 (PFS rate): DVRd 68.1% vs VRd 49.5%
   - 완전관해 이상 반응률: DVRd군 81.2% (sCR 65.0%) vs VRd군 61.6% (sCR 44.4%) (Odds Ratio 2.73, P<0.0001)
   - 전체 생존기간 (OS): DVRd군 사망 51명 vs VRd군 사망 60명. HR 0.85 (95% CI 0.58 - 1.24)로 통계적 유의한 차이는 아직 보고되지 않음. COVID-19 전염병 사망 보정 시 위험비 HR 0.69 (95% CI 0.45 - 1.05)로 완화됨.

3) 안전성 평가 및 이상반응 수치 (DVRd군 N=197, VRd군 N=195 안전성 분석대상):
   - 중대한 이상반응 (Serious Adverse Events): DVRd군 72.1% vs VRd군 67.2임.
   - 호중구감소증 (Any Grade): DVRd군 55.8% (Grade 3/4: 44.2%) vs VRd군 39.0% (Grade 3/4: 29.7%)
   - 혈소판감소증 (Any Grade): DVRd군 46.7% (Grade 3/4: 28.4%) vs VRd군 33.8% (Grade 3/4: 20.0%)
   - 빈혈 (Any Grade): DVRd군 37.1% (Grade 3/4: 13.2%) vs VRd군 31.8% (Grade 3/4: 11.8%)
   - 림프구감소증: DVRd군 18.3% (Grade 3/4: 12.2%) vs VRd군 17.4% (Grade 3/4: 10.3%)
   - 설사 (Any): DVRd군 56.9% (Grade 3/4: 12.2%) vs VRd군 59.0% (Grade 3/4: 9.2%)
   - 말초 감각 신경병증 (Any): DVRd군 55.8% (Grade 3/4: 8.1%) vs VRd군 61.0% (Grade 3/4: 8.2%)
   - 말초 부종 (Any): DVRd군 42.1% (Grade 3/4: 2.0%) vs VRd군 39.0% (Grade 3/4: 0.5%)
   - 변비 (Any): DVRd군 38.1% (Grade 3/4: 2.0%) vs VRd군 42.1% (Grade 3/4: 2.6%)
   - 불면증 (Any): DVRd군 32.0% (Grade 3/4: 2.0%) vs VRd군 32.3% (Grade 3/4: 1.0%)
   - 피로 (Any): DVRd군 32.0% (Grade 3/4: 9.1%) vs VRd군 30.8% (Grade 3/4: 8.2%)
   - 폐렴 (Any): DVRd군 24.4% (Grade 3/4: 14.2%) vs VRd군 20.0% (Grade 3/4: 12.8%)
   - 이상반응으로 인한 투여 영구 중단 비율: DVRd군 7.6% vs VRd군 15.9%

○ 결론 (Conclusion)
새롭게 진단된 자가조혈모세포 이식 부적합/지연 다발골수종 환자군에서, 표준 요법인 VRd에 Daratumumab SC를 추가한 4제 병용요법(DVRd)은 대조군 대비 무진행생존기간(PFS)을 아주 큰 유의차로 개선하고 높은 수준의 지속 미세잔존질환(MRD) 음성 및 CR율을 달성했음. 이 분석에 기초하여, 이식 대상이 아닌 NDMM 환자에서 치료 효과 향상을 이끌어낼 수 있는 견고한 새로운 1차 표준 치료법으로 DVRd quadruplet 요법이 타당함을 명백히 증명함.

○ 한계점 (Limitations)
미국 연구군 구성 중 흑인 소수 인종 비중(4.8%)이 다소 낮아 전 세계 일반화에 일부 구조적 제약이 있을 수 있음.

○ 후원사 (Sponsor): Johnson & Johnson`
  },
  {
    id: "flaura2",
    title: "FLAURA2 Phase 3 Trial (Osimertinib + Chemotherapy vs Osimertinib NSCLC)",
    type: "RCT",
    shortDesc: "EGFR 변이 비소세포폐암 대상 Osimertinib 병용요법 문헌",
    text: `Title: Osimertinib with or without Chemotherapy in EGFR-Mutated Advanced NSCLC: the FLAURA2 randomized phase 3 study

Authors: Pasi A. Jänne, David Planchard, et al.
Citation: New England Journal of Medicine. 2023;389(22):2043-2056. (NCT04035486)
Countries: Argentina, Australia, Canada, China, France, Germany, Italy, Japan, Korea, Spain, Taiwan, United Kingdom, United States

Background:
Osimertinib is the standard first-line treatment for EGFR-mutated advanced non-small-cell lung cancer (NSCLC). This study investigated whether combining osimertinib with platinum-pemetrexed chemotherapy further prolongs progression-free survival (PFS).

Methods:
An international, open-label, randomized phase 3 trial. 557 patients with untreated EGFR-mutated (Exon 19 deletion or L858R) advanced adenocarcinoma NSCLC. Patients randomly Assigned 1:1 to osimertinib plus chemotherapy or osimertinib monotherapy.

Osimertinib-Chemotherapy Arm (n=279): Osimertinib (80 mg once daily PO) plus pemetrexed (500 mg/m2) and either cisplatin (75 mg/m2) or carboplatin (AUC 5) every 3 weeks for 4 cycles, followed by osimertinib PO daily plus pemetrexed maintenance every 3 weeks.
Osimertinib-only Arm (n=278): Osimertinib (80 mg once daily PO) monotherapy until disease progression.

Inclusion criteria: Stage IIIB/IIIC or IV NSCLC, EGFR exon 19 deletion or L858R mutation, ECOG performance status 0 or 1, no prior systemic therapy for advanced NSCLC, stable CNS metastases allowed.
Exclusion criteria: Prior EGFR-TKI or systemic chemotherapy for advanced disease, severe cardiac disease (QTc interval >470 ms), interstitial lung disease history.

Endpoints:
Primary: Progression-free survival (PFS) by investigator assessment.
Secondary: PFS by blinded independent review (BICR), objective response rate, duration of response, disease control rate, overall survival (OS), and safety.

Results:
Median primary follow-up: 19.5 months.
Investigator-assessed PFS:
Osimertinib-Chemotherapy group: Median PFS was 25.3 months (95% CI, 24.0 to 35.8).
Osimertinib-alone group: Median PFS was 16.7 months (95% CI, 14.1 to 18.6).
Hazard Ratio (HR) for disease progression or death was 0.62 (95% CI, 0.49 to 0.79; P<0.001).

BICR-assessed PFS:
Osimertinib-Chemotherapy: Median PFS was 29.4 months (95% CI, 25.1 to NR).
Osimertinib monotherapy: Median PFS was 19.9 months (95% CI, 16.6 to 25.3).
Hazard Ratio (HR) was 0.62 (95% CI, 0.48 to 0.80; P=0.0002).

Overall response rate (ORR): 83.2% with combination versus 75.5% with monotherapy.
Overall survival (OS): Interim 2-year analysis trends in favor of combination (HR 0.90, 95% CI 0.70-1.15; follow-up ongoing).

Safety:
Grade 3 or higher adverse events: combination (64%) vs monotherapy (27%).
Most common grade 3/4 toxicities in combination: anemia (20%), neutropenia (19%), thrombocytopenia (14%).
Interstitial lung disease (ILD) / pneumonitis of any grade occurred in 3.2% in combination and 3.6% in monotherapy.

Conclusion:
In patients with EGFR-mutated advanced NSCLC, first-line osimertinib plus chemotherapy resulted in significantly longer progression-free survival compared to osimertinib monotherapy alone. Combination therapy had higher toxicities but was clinically manageable.

Limitations: Open-label design could introduce assessment bias; survival data still immature.
Sponsor: AstraZeneca PLC`
  }
];
