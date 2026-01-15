export interface Receipt {
  id: string;
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
