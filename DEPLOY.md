# 🏥 심평원 임상문헌 요약표 생성기 — GitHub + Vercel 배포 가이드

## 📁 최종 프로젝트 구조

```
hira-app/
├── api/
│   └── summarize.ts        ← Vercel 서버리스 함수 (API 백엔드)
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── types.ts
│   └── components/
│       ├── ManualInputForm.tsx
│       ├── SamplePapers.ts
│       └── SummaryTable.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── vercel.json             ← Vercel 배포 설정
├── .env.example
├── .gitignore
└── server.ts               ← 로컬 개발용 (Vercel 배포 시 미사용)
```

---

## 🔧 수정된 버그 목록

| 위치 | 버그 내용 | 수정 |
|------|-----------|------|
| `server.ts` | `gemini-3.5-flash` 모델 없음 | `gemini-2.5-flash`로 변경 |
| 구조 | Express 서버는 Vercel 미지원 | `api/summarize.ts` 서버리스 함수로 분리 |
| `vercel.json` | 없음 | 신규 생성 (라우팅 + 함수 설정) |
| `tsconfig.json` | `api/` 폴더 미포함 | include에 추가 |
| `package.json` | Vercel 빌드 스크립트 없음 | `build:vercel` 추가, `@vercel/node` 추가 |

---

## 🚀 배포 단계별 가이드

### 1단계: GitHub 레포지토리 생성

1. [github.com](https://github.com) 접속 → 로그인
2. 우측 상단 **`+`** → **New repository** 클릭
3. 설정:
   - Repository name: `hira-literature-summarizer` (원하는 이름)
   - Visibility: **Private** 권장 (API 키 노출 방지)
   - README 초기화: 체크 안 함
4. **Create repository** 클릭

---

### 2단계: 프로젝트를 GitHub에 올리기

터미널(Mac/Linux) 또는 Git Bash(Windows)에서:

```bash
# 프로젝트 폴더로 이동
cd 프로젝트폴더경로

# Git 초기화
git init

# 모든 파일 추가 (.env는 .gitignore로 자동 제외됨)
git add .

# 첫 커밋
git commit -m "초기 배포: 심평원 임상문헌 요약표 생성기"

# GitHub 레포와 연결 (GitHub에서 복사한 URL 사용)
git remote add origin https://github.com/your-username/hira-literature-summarizer.git

# 업로드
git push -u origin main
```

> **GitHub Desktop 사용 시**: File → Add Local Repository → 폴더 선택 → Publish repository

---

### 3단계: Vercel 프로젝트 연결

1. [vercel.com](https://vercel.com) 접속 → Google/GitHub 계정으로 로그인
2. 대시보드에서 **Add New → Project** 클릭
3. **Import Git Repository** 에서 방금 만든 레포 선택
4. **Import** 클릭

---

### 4단계: 빌드 설정 확인

Vercel이 자동 감지하지만, 아래와 같이 설정되어 있는지 확인:

| 항목 | 값 |
|------|-----|
| Framework Preset | `Vite` |
| Build Command | `npm run build:vercel` |
| Output Directory | `dist` |
| Install Command | `npm install` |

---

### 5단계: 환경변수(API 키) 등록 ← 가장 중요!

**Deploy 전에 반드시 설정해야 합니다.**

1. Vercel 프로젝트 설정 화면에서 **Environment Variables** 섹션 찾기
2. 아래 변수 추가:

| Name | Value | Environment |
|------|-------|-------------|
| `GEMINI_API_KEY` | `AIza...` (발급받은 키 전체) | Production, Preview, Development 모두 체크 |

3. **Save** 클릭

> **Gemini API 키 발급 방법:**
> 1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) 접속
> 2. **Create API key** 클릭
> 3. 발급된 `AIza...` 형태의 키 복사

---

### 6단계: 배포 실행

1. **Deploy** 버튼 클릭
2. 빌드 로그 확인 (약 1~2분 소요)
3. 완료 시 `https://your-app.vercel.app` 형태의 URL 발급

---

## ✅ 배포 후 확인 사항

배포된 URL에서 다음을 테스트:

- [ ] 샘플 논문 클릭 → 텍스트 자동 입력 확인
- [ ] **AI 자동 생성 버튼** 클릭 → 요약표 생성 확인
- [ ] 결과 탭에서 표 정상 출력 확인
- [ ] HTML 다운로드 버튼 동작 확인

---

## 🔄 코드 수정 후 재배포

코드를 수정하면 GitHub에 push하는 것만으로 자동 재배포됩니다:

```bash
git add .
git commit -m "수정 내용 설명"
git push
```

Vercel이 push를 감지해 자동으로 새 배포를 시작합니다.

---

## 🛠 로컬 개발 환경 설정

```bash
# 의존성 설치
npm install

# .env 파일 생성
cp .env.example .env
# .env 파일 열어서 GEMINI_API_KEY 값 입력

# 개발 서버 실행 (localhost:3000)
npm run dev
```

---

## ❓ 자주 발생하는 오류

### "Function timeout" 오류
`vercel.json`의 `maxDuration: 60`이 설정되어 있습니다. Gemini 응답이 느린 경우 발생할 수 있으며, 무료 플랜에서는 최대 60초까지 허용됩니다.

### "GEMINI_API_KEY is not defined" 오류
Vercel 환경변수에 키가 등록되지 않은 것입니다. 5단계를 다시 확인하고 **Redeploy** 하세요.

### 빌드 실패 (TypeScript 오류)
```bash
npm run lint  # 로컬에서 먼저 확인
```

### API 응답 없음 (네트워크 오류)
브라우저 개발자 도구 → Network 탭에서 `/api/summarize` 요청 상태 코드 확인.
