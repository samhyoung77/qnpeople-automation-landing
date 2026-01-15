import { Receipt } from '../types/receipt';

const SHEET_ID = '1mOXhWNtxFVtOIMPvfcK1cmmjK828PmHdRL1SXZfxuwo';
const SHEET_NAME = 'Receipts';
const WEBHOOK_URL = 'https://n8n.samsamsam.org/webhook/cffdacc8-de1a-4873-8dbc-51845694f446';

// Google Sheets API를 통해 JSON 데이터 가져오기
export async function fetchReceipts(): Promise<Receipt[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
    const response = await fetch(url);
    const text = await response.text();

    // Google Sheets JSON은 "google.visualization.Query.setResponse(" 형식으로 래핑되어 있음
    const jsonString = text.substring(47).slice(0, -2);
    const data = JSON.parse(jsonString);

    const rows = data.table.rows;
    const receipts: Receipt[] = [];

    // 각 행을 Receipt 객체로 변환
    for (const row of rows) {
      const cells = row.c;

      // null이 아닌 셀만 처리
      if (!cells || cells.every((cell: any) => !cell)) continue;

      const receipt: Receipt = {
        id: cells[0]?.v || '',
        image: cells[1]?.v || undefined,
        거래일: cells[2]?.f || cells[2]?.v || '',
        청구대상여부: cells[3]?.v || undefined,
        구분: cells[4]?.v || '',
        이용지점: cells[5]?.v || '',
        금액: typeof cells[6]?.v === 'number' ? cells[6].v : 0,
        카드종류: cells[7]?.v || undefined,
        메모: cells[8]?.v || undefined,
        비고: cells[9]?.v || undefined,
        url: cells[10]?.v || undefined,
      };

      // ID가 있는 경우만 추가
      if (receipt.id) {
        receipts.push(receipt);
      }
    }

    return receipts;
  } catch (error) {
    console.error('Failed to fetch receipts from Google Sheets:', error);
    return [];
  }
}

// CSV 형식으로 가져오기 (대안)
export async function fetchReceiptsFromCSV(): Promise<Receipt[]> {
  try {
    // Receipts 시트의 GID를 찾아야 함 (보통 0이 첫 번째 시트)
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    const response = await fetch(url);
    const text = await response.text();

    const lines = text.split('\n');
    const headers = lines[0].split(',');
    const receipts: Receipt[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      const receipt: Receipt = {
        id: values[0] || `receipt-${i}`,
        image: values[1] || undefined,
        거래일: values[2] || '',
        청구대상여부: values[3] || undefined,
        구분: values[4] || '',
        이용지점: values[5] || '',
        금액: parseFloat(values[6]?.replace(/[^0-9.-]/g, '') || '0'),
        카드종류: values[7] || undefined,
        메모: values[8] || undefined,
        비고: values[9] || undefined,
        url: values[10] || undefined,
      };

      if (receipt.id && receipt.이용지점) {
        receipts.push(receipt);
      }
    }

    return receipts;
  } catch (error) {
    console.error('Failed to fetch receipts from CSV:', error);
    return [];
  }
}

// 영수증 업데이트
export async function updateReceipt(receipt: Receipt): Promise<boolean> {
  try {
    console.log('📤 영수증 업데이트 요청:', receipt);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        data: {
          id: receipt.id,
          image: receipt.image,
          거래일: receipt.거래일,
          청구대상여부: receipt.청구대상여부,
          구분: receipt.구분,
          이용지점: receipt.이용지점,
          금액: receipt.금액,
          카드종류: receipt.카드종류,
          메모: receipt.메모,
          비고: receipt.비고,
          url: receipt.url,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 업데이트 실패:', errorText);
      throw new Error(`업데이트 실패: ${response.status}`);
    }

    console.log('✅ 영수증 업데이트 완료');
    return true;
  } catch (error) {
    console.error('Failed to update receipt:', error);
    throw error;
  }
}

// 영수증 삭제
export async function deleteReceipt(receiptId: string): Promise<boolean> {
  try {
    console.log('🗑️ 영수증 삭제 요청:', receiptId);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        data: {
          id: receiptId,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 삭제 실패:', errorText);
      throw new Error(`삭제 실패: ${response.status}`);
    }

    console.log('✅ 영수증 삭제 완료');
    return true;
  } catch (error) {
    console.error('Failed to delete receipt:', error);
    throw error;
  }
}
