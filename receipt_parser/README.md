# 영수증 관리 앱 (Receipt Manager)

Google Sheets와 연동되는 영수증 관리 웹 애플리케이션입니다. 카메라로 영수증을 촬영하면 AI가 자동으로 정보를 추출하여 스프레드시트에 저장합니다.

## 주요 기능

### 1. 영수증 스캔 및 자동 분석
- 📸 카메라로 직접 촬영 또는 갤러리에서 이미지 선택
- 🤖 AI 기반 자동 정보 추출 (상호명, 금액, 날짜, 카테고리 등)
- 💾 Google Sheets에 자동 저장
- 🖼️ Google Drive에 이미지 자동 업로드

### 2. 영수증 목록 관리
- 📋 저장된 영수증 목록 조회
- 🔍 카테고리별 필터링
- 💳 카드종류, 청구대상 표시

### 3. 영수증 상세 정보
- ✏️ 모든 필드 편집 가능
- 📝 메모 및 비고 추가
- 🖼️ 영수증 이미지 표시

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 3. Google Sheets 설정

#### 3.1 스프레드시트 구조
다음 열을 포함하는 'Receipts' 시트를 생성하세요:

| 열 이름 | 설명 | 예시 |
|--------|------|------|
| ID | 고유 식별자 (자동 생성) | 129b2c13 |
| Image | Google Drive 직접 이미지 링크 | https://drive.google.com/uc?export=view&id=xxxxx |
| 거래일 | 거래 날짜 | 2024-01-13 |
| 청구대상여부 | O 또는 X | O |
| 구분 | 카테고리 | 식사, 마트, 커피 |
| 이용지점 | 상호명 | 스타벅스 강남점 |
| 금액 | 결제 금액 | 5500 |
| 카드종류 | 법인카드 또는 개인카드 | 법인카드 |
| 메모 | 메모 | 팀 점심 |
| 비고 | 추가 정보 | - |
| URL | Google Drive 파일 보기 URL | https://drive.google.com/file/d/xxxxx/view |

#### 3.2 스프레드시트 공개 설정
1. 스프레드시트 우측 상단의 **공유** 버튼 클릭
2. **액세스 권한** 섹션에서 **제한됨** → **링크가 있는 모든 사용자**로 변경
3. **완료** 클릭

#### 3.3 스프레드시트 ID 확인
스프레드시트 URL에서 ID를 확인하세요:
```
https://docs.google.com/spreadsheets/d/[스프레드시트ID]/edit
```

`src/services/googleSheets.ts` 파일의 `SHEET_ID` 값을 업데이트하세요.

## 영수증 스캔 방법

### 1. 카메라 버튼 클릭
하단 중앙의 파란색 카메라 버튼을 클릭합니다.

### 2. 이미지 선택
- **모바일**: 카메라 촬영 또는 갤러리 선택 옵션 표시
- **데스크톱**: 파일 선택 창 열림

### 3. 이미지 확인
선택한 이미지의 썸네일이 표시됩니다.

### 4. 분석 시작
**이미지 분석하기** 버튼을 클릭합니다.

### 5. 자동 처리 (통합 워크플로우)
1. 통합 웹훅으로 이미지 전송
2. OpenAI GPT-4O로 영수증 정보 자동 분석
3. 고유 ID 생성 및 파일명 생성
4. Google Drive "Receipt Images" 폴더에 이미지 업로드
5. 추출된 정보를 Google Sheets에 자동 저장
6. 분석 결과 반환 및 영수증 목록 새로고침

## 웹훅 설정

### 통합 워크플로우 웹훅
하나의 웹훅으로 이미지 분석과 저장을 모두 처리합니다.

```
URL: https://n8n.samsamsam.org/webhook/cffdacc8-de1a-4873-8dbc-51845694f446
Method: POST
Body: FormData (image, imageBase64)

응답 형식:
{
  "success": true,
  "message": "영수증이 분석되고 저장되었습니다",
  "data": {
    "vendor": "스타벅스 강남점",
    "date": "2026-01-09",
    "amount": "12500",
    "category": "식대"
  }
}
```

**워크플로우 구성:**
1. Webhook - 이미지 수신
2. OpenAI GPT-4O - 영수증 분석
3. Parse AI Response - 데이터 변환 및 ID 생성
4. Upload to Google Drive - 이미지 업로드
5. Prepare Sheet Data - Google Sheets용 데이터 준비
6. Append row in sheet - Google Sheets에 저장
7. Respond to Webhook - 결과 반환

웹훅 URL을 변경하려면 `src/services/receiptAnalyzer.ts` 파일의 `UNIFIED_WEBHOOK` 상수를 수정하세요.

## n8n 워크플로우 설정

### 1. Google Drive 폴더 생성 및 공개 설정
1. Google Drive에서 **내 드라이브 > Receipt Images** 폴더 생성
2. 폴더를 우클릭 → **공유** → **링크가 있는 모든 사용자**로 설정
3. **뷰어** 권한으로 설정 (편집 권한 불필요)
4. 이 폴더에 업로드된 모든 이미지가 공개 링크로 접근 가능해집니다

### 2. n8n 워크플로우 임포트
1. n8n 대시보드에서 **Workflows** 메뉴로 이동
2. **Import from File** 또는 **Import from URL** 클릭
3. `combined-workflow-with-drive.json` 파일 선택
4. 워크플로우가 임포트되면 자동으로 열립니다

### 3. Google Drive 인증 설정
1. **Upload to Google Drive** 노드 클릭
2. **Credentials** 섹션에서 **Create New** 클릭
3. **OAuth2** 방식 선택
4. Google OAuth 인증 완료:
   - Client ID와 Client Secret 입력 (Google Cloud Console에서 발급)
   - 또는 n8n에서 제공하는 간편 인증 사용
5. **Save** 클릭하여 인증 정보 저장

### 4. Google Sheets 인증 설정
1. **Append row in sheet** 노드 클릭
2. 이미 설정된 인증이 있다면 재사용 가능
3. 없다면 Google Drive와 동일하게 OAuth2 인증 설정

### 5. OpenAI API 키 설정
1. **Message a model** 노드 클릭
2. **Credentials** 섹션에서 OpenAI API 키 입력
3. 모델은 **gpt-4o**로 설정되어 있습니다

### 6. 워크플로우 활성화
1. 우측 상단의 **Active** 토글 스위치 클릭
2. 워크플로우가 활성화되면 웹훅이 작동합니다

### 7. 동작 확인
업로드된 이미지는 다음과 같이 저장됩니다:
- **Google Drive 경로**: `내 드라이브/Receipt Images/129b2c13.Image.120556.jpg`
- **스프레드시트 B열 (Image)**: `https://drive.google.com/uc?export=view&id=xxxxx` (직접 이미지 링크)
- **스프레드시트 K열 (URL)**: `https://drive.google.com/file/d/xxxxx/view` (파일 보기 페이지)
- **앱에서 썸네일 표시**: Image 컬럼의 공개 링크를 사용하여 이미지 표시 ✅

### 8. 파일명 형식
자동 생성되는 파일명은 다음 형식을 따릅니다:
- `{8자리랜덤ID}.Image.{타임스탬프}.jpg`
- 예시: `129b2c13.Image.120556.jpg`

## 파일 구조

```
src/
├── App.tsx                      # 메인 애플리케이션
├── ReceiptDetailModal.tsx       # 영수증 상세 모달
├── ImageUploadModal.tsx         # 이미지 업로드 모달
├── types/
│   └── receipt.ts              # 타입 정의
└── services/
    ├── googleSheets.ts         # Google Sheets 연동
    └── receiptAnalyzer.ts      # 웹훅 호출 및 이미지 분석
```

## 기술 스택

- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Vite** - 빌드 도구
- **Google Sheets API** - 데이터 저장소
- **Google Drive API** - 이미지 저장소
- **OpenAI GPT-4O** - 영수증 OCR 및 분석
- **n8n Webhooks** - 워크플로우 자동화

## 빌드

프로덕션 빌드:
```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## 문제 해결

### 영수증 목록이 표시되지 않음
1. 스프레드시트 공개 설정 확인
2. 스프레드시트 ID가 올바른지 확인
3. 'Receipts' 시트 이름 확인
4. 브라우저 콘솔에서 에러 메시지 확인

### 이미지 분석이 실패함
1. 웹훅 URL이 올바른지 확인
2. 네트워크 연결 확인
3. 이미지 형식이 지원되는지 확인 (JPG, PNG)
4. 브라우저 콘솔에서 에러 로그 확인

### CORS 에러
- 웹훅 서버에서 CORS 설정이 필요할 수 있습니다
- n8n 웹훅 설정에서 CORS 허용 확인

## 라이선스

MIT

## 개발자

Claude Code로 개발되었습니다.
