# 문의 폼 설정 가이드

## 개요

이 가이드는 웹사이트 문의 폼을 Notion 데이터베이스와 연동하는 방법을 설명합니다.

## 필요한 것

- Notion 계정 (무료 가능)
- Google 계정
- Notion Database ID
- Notion Integration Token

---

## 1단계: Notion 데이터베이스 설정

### 1.1 Notion 데이터베이스 확인

현재 Notion 페이지: https://www.notion.so/Qnpeople-Automation-2dae706187e280cab5c5c3f92809ad8b

이 페이지를 데이터베이스로 변환하거나, 새 데이터베이스를 생성해야 합니다.

### 1.2 데이터베이스 속성 생성

다음 속성들을 데이터베이스에 추가하세요:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| 성함 | Title | 문의자 이름 (필수) |
| 이메일 | Email | 이메일 주소 |
| 회사명 | Text | 회사명 |
| 전화번호 | Phone | 전화번호 |
| 직함 | Text | 직함/직책 |
| 문의내용 | Text | 문의 내용 |
| 접수일시 | Date | 문의 접수 시간 |
| 상태 | Select | 처리 상태 (옵션: 신규, 진행중, 완료) |

### 1.3 데이터베이스 ID 확인

1. Notion 데이터베이스 페이지를 열기
2. URL에서 데이터베이스 ID 복사
   ```
   https://www.notion.so/{workspace}/{DATABASE_ID}?v={view_id}
   ```
   예: `2dae706187e280cab5c5c3f92809ad8b`

---

## 2단계: Notion Integration 생성

### 2.1 Integration 만들기

1. https://www.notion.so/my-integrations 접속
2. **"+ New integration"** 클릭
3. 설정:
   - **Name**: Q&People Contact Form
   - **Associated workspace**: 본인의 워크스페이스 선택
   - **Type**: Internal
   - **Capabilities**:
     - ✅ Read content
     - ✅ Insert content
     - ✅ Update content
4. **"Submit"** 클릭
5. **"Internal Integration Token"** 복사 (나중에 사용)
   - 형식: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2.2 데이터베이스에 Integration 연결

1. Notion 데이터베이스 페이지 열기
2. 우측 상단 **"..."** 메뉴 클릭
3. **"Add connections"** 선택
4. 방금 만든 Integration (**Q&People Contact Form**) 선택
5. **"Confirm"** 클릭

---

## 3단계: Google Apps Script 설정

### 3.1 Apps Script 프로젝트 생성

1. https://script.google.com/ 접속
2. **"New project"** 클릭
3. 프로젝트 이름: `Q&People Contact Form Handler`

### 3.2 코드 복사

1. 기본 코드 삭제
2. `google-apps-script.js` 파일의 코드를 복사하여 붙여넣기
3. **저장** (Ctrl+S 또는 💾 아이콘)

### 3.3 Script Properties 설정

1. 좌측 메뉴에서 **⚙️ Project Settings** 클릭
2. 아래로 스크롤하여 **"Script Properties"** 섹션 찾기
3. **"Add script property"** 클릭
4. 두 개의 속성 추가:

   **첫 번째 속성:**
   - Property: `NOTION_API_KEY`
   - Value: `secret_xxxxxxxxxxxxx` (2.1에서 복사한 Integration Token)

   **두 번째 속성:**
   - Property: `NOTION_DATABASE_ID`
   - Value: `2dae706187e280cab5c5c3f92809ad8b` (1.3에서 확인한 Database ID)

5. **"Save script properties"** 클릭

### 3.4 테스트 실행

1. 편집기로 돌아가기 (좌측 **"Editor"** 클릭)
2. 함수 선택 드롭다운에서 **`testNotionConnection`** 선택
3. **▶️ Run** 클릭
4. 권한 요청이 나타나면:
   - **"Review permissions"** 클릭
   - 본인의 Google 계정 선택
   - **"Advanced"** → **"Go to Q&People Contact Form Handler (unsafe)"** 클릭
   - **"Allow"** 클릭
5. 하단 **Execution log** 확인
   - 성공: `Test successful! Notion page created: xxx`
   - 실패: 에러 메시지 확인

### 3.5 Web App 배포

1. 우측 상단 **"Deploy"** → **"New deployment"** 클릭
2. **⚙️ 아이콘** 클릭 → **"Web app"** 선택
3. 설정:
   - **Description**: Initial deployment
   - **Execute as**: Me (본인 이메일)
   - **Who has access**: Anyone
4. **"Deploy"** 클릭
5. **Web app URL** 복사
   - 형식: `https://script.google.com/macros/s/xxxxx/exec`

---

## 4단계: 웹사이트에 URL 연결

### 4.1 index.html 수정

1. `index.html` 파일 열기
2. 1779번째 줄 찾기:
   ```javascript
   const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. URL 업데이트:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/xxxxx/exec';
   ```
4. 저장

### 4.2 GitHub에 푸시

```bash
git add index.html
git commit -m "Add contact form with Notion integration"
git push
```

---

## 5단계: 테스트

1. 웹사이트 접속: https://samhyoung77.github.io/qnpeople-automation-landing/
2. **문의하기** 섹션으로 스크롤
3. 테스트 데이터 입력:
   - 성함: 홍길동
   - 이메일: test@example.com
   - 회사명: 테스트 회사
   - 전화번호: 010-1234-5678
   - 직함: 테스트
   - 문의내용: 테스트 문의입니다.
4. **제출하기** 클릭
5. 성공 메시지 확인
6. Notion 데이터베이스에서 새 항목 확인

---

## 문제 해결

### Notion API 오류

**증상**: "Notion API Error: object not found"

**해결**:
- Integration이 데이터베이스에 연결되었는지 확인 (2.2 단계)
- Database ID가 정확한지 확인

### CORS 오류

**증상**: 브라우저 콘솔에 CORS 에러

**해결**:
- Google Apps Script가 `doPost` 함수로 배포되었는지 확인
- "Who has access"가 "Anyone"으로 설정되었는지 확인

### 폼 제출 후 응답 없음

**해결**:
1. 브라우저 개발자 도구 열기 (F12)
2. **Console** 탭에서 에러 확인
3. **Network** 탭에서 요청 상태 확인
4. Google Apps Script의 **Execution log** 확인

---

## 보안 참고사항

- Notion API Key는 절대 GitHub에 커밋하지 마세요
- Google Apps Script의 Script Properties에만 저장하세요
- Integration Token이 노출되면 즉시 재생성하세요

---

## 추가 기능 (선택사항)

### 이메일 알림 추가

Google Apps Script에 다음 함수 추가:

```javascript
function sendEmailNotification(formData) {
  const recipient = 'shcho@qnpeople.com';
  const subject = '[문의] ' + formData.company + ' - ' + formData.name;
  const body = `
새로운 문의가 접수되었습니다.

성함: ${formData.name}
이메일: ${formData.email}
회사명: ${formData.company}
전화번호: ${formData.phone}
직함: ${formData.position}

문의내용:
${formData.message}

접수일시: ${formData.timestamp}
  `;

  MailApp.sendEmail(recipient, subject, body);
}
```

그리고 `doPost` 함수에서 호출:

```javascript
// Send to Notion
const notionResponse = createNotionPage(data);

// Send email notification
sendEmailNotification(data);
```

---

완료! 문의 폼이 정상적으로 작동합니다. 🎉
