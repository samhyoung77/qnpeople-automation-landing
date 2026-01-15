// 통합 워크플로우 웹훅 URL (이미지 분석 + 자동 저장)
const UNIFIED_WEBHOOK = 'https://n8n.samsamsam.org/webhook/cffdacc8-de1a-4873-8dbc-51845694f446';

export interface AnalyzedReceipt {
  id?: string;
  image?: string;
  거래일: string;
  청구대상여부?: string;
  구분: string;
  이용지점: string;
  금액: number;
  카드종류?: string;
  메모?: string;
  비고?: string;
  url?: string;
}

/**
 * 이미지를 Base64로 변환
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 통합 워크플로우: 이미지 분석 및 저장
 *
 * 하나의 웹훅으로 다음 작업을 모두 수행합니다:
 * 1. OpenAI GPT-4O로 영수증 이미지 분석
 * 2. 추출된 정보를 Google Sheets에 자동 저장
 * 3. 분석 결과 반환
 */
export interface UploadOptions {
  cardType?: string;      // 카드종류: 법인카드, 개인카드
  billable?: string;      // 청구대상여부: O, X
}

export async function analyzeAndSaveReceipt(imageFile: File, options?: UploadOptions): Promise<AnalyzedReceipt> {
  console.log('🚀 영수증 처리 시작 (통합 워크플로우)');

  try {
    console.log('📸 이미지 정보:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
    });
    console.log('📋 추가 옵션:', options);

    // 이미지를 Base64로 변환
    const base64Image = await imageToBase64(imageFile);
    console.log('✅ Base64 변환 완료');

    // FormData 생성
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('imageBase64', base64Image);

    // 카드종류와 청구대상여부 추가
    if (options?.cardType) {
      formData.append('cardType', options.cardType);
    }
    if (options?.billable) {
      formData.append('billable', options.billable);
    }

    console.log('📤 통합 웹훅 호출 중:', UNIFIED_WEBHOOK);

    // 통합 웹훅 호출 (이미지 분석 + 자동 저장)
    const response = await fetch(UNIFIED_WEBHOOK, {
      method: 'POST',
      body: formData,
    });

    console.log('📥 응답 수신:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 응답 에러:', errorText);
      throw new Error(`처리 실패: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const responseText = await response.text();
    console.log('📄 원본 응답:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('✅ 파싱된 응답 데이터:', responseData);
      console.log('🔍 responseData 타입:', typeof responseData, Array.isArray(responseData) ? '(배열)' : '(객체)');
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', parseError);
      throw new Error('응답 데이터를 파싱할 수 없습니다');
    }

    // 응답에서 실제 데이터 추출
    // 통합 워크플로우는 { success: true, message: "...", data: {...} } 형식으로 응답
    let data = responseData.data || responseData;
    console.log('1️⃣ responseData.data || responseData:', data);

    // 배열 형태로 온 경우 첫 번째 요소 추출
    if (Array.isArray(data)) {
      console.log('⚠️ 응답이 배열 형태입니다. 첫 번째 요소를 추출합니다.');
      console.log('📦 배열 내용:', data);
      data = data[0] || {};
      console.log('2️⃣ 배열에서 추출한 첫 번째 요소:', data);
    }

    console.log('🔍 최종 data 객체:', data);
    console.log('💰 금액 필드:', {
      'data.금액': data.금액,
      'data.amount': data.amount,
      'typeof data.금액': typeof data.금액,
      'typeof data.amount': typeof data.amount
    });

    // 응답 데이터를 Receipt 형식으로 변환
    // 한글 필드명 우선, 영문 필드명은 대체값
    const result: AnalyzedReceipt = {
      거래일: data.거래일 || data.date || '',
      이용지점: data.이용지점 || data.vendor || '',
      금액: data.금액 ? Number(String(data.금액).replace(/[^0-9]/g, '')) : (data.amount ? Number(String(data.amount).replace(/[^0-9]/g, '')) : 0),
      구분: data.구분 || data.category || '',
      카드종류: data.카드종류 || data.cardType || '',
      청구대상여부: data.청구대상여부 || data.billable || '',
      메모: data.메모 || data.memo || '',
      비고: data.비고 || data.remark || '',
      image: data.image || base64Image,  // n8n 응답의 image 우선, 없으면 로컬 base64
    };

    console.log('✅ 변환된 영수증 데이터:', result);
    console.log('🎉 영수증 분석 및 저장 완료!');

    return result;
  } catch (error) {
    console.error('💥 영수증 처리 실패:', error);
    throw error;
  }
}
