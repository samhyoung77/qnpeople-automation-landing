import { useState, useEffect, useRef } from 'react';
import ReceiptDetailModal from './ReceiptDetailModal';
import ImageUploadModal from './ImageUploadModal';
import { Receipt } from './types/receipt';
import { fetchReceipts, updateReceipt, deleteReceipt } from './services/googleSheets';
import { AnalyzedReceipt } from './services/receiptAnalyzer';

type TabType = 'home' | 'list' | 'stats' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(() => {
    // 초기화 시 sessionStorage 확인 (카메라에서 돌아온 경우)
    return sessionStorage.getItem('uploadModalOpen') === 'true';
  });
  const uploadModalShouldBeOpen = useRef(sessionStorage.getItem('uploadModalOpen') === 'true');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | undefined>(undefined);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // 컴포넌트 마운트 시 Google Sheets에서 데이터 가져오기
  useEffect(() => {
    loadReceipts();
  }, []);

  // 페이지 visibility 변경 감지 (카메라에서 돌아올 때 모달 상태 복원)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && uploadModalShouldBeOpen.current) {
        setIsUploadModalOpen(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchReceipts();

      if (data.length === 0) {
        // 데이터가 없으면 샘플 데이터 표시
        const sampleData: Receipt[] = [
          {
            id: 'sample-1',
            거래일: '2024-01-10',
            이용지점: '맥도날드 송파점',
            금액: 12000,
            구분: '식사',
            카드종류: '법인카드',
            청구대상여부: 'O',
            메모: '팀 점심 식사',
          },
          {
            id: 'sample-2',
            거래일: '2024-01-09',
            이용지점: '이마트 강동점',
            금액: 45000,
            구분: '마트',
            카드종류: '개인카드',
            청구대상여부: 'X',
            메모: '식료품 구매',
          },
          {
            id: 'sample-3',
            거래일: '2024-01-08',
            이용지점: '올리브영 강남점',
            금액: 32000,
            구분: '화장품',
            카드종류: '개인카드',
            청구대상여부: 'X',
          },
        ];
        setReceipts(sampleData);
        setError('스프레드시트에 데이터가 없습니다. 샘플 데이터를 표시합니다.');
      } else {
        setReceipts(data);
      }
    } catch (err) {
      console.error('Failed to load receipts:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptClick = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsModalOpen(true);
  };

  const handleCameraClick = () => {
    uploadModalShouldBeOpen.current = true;
    sessionStorage.setItem('uploadModalOpen', 'true');
    setIsUploadModalOpen(true);
  };

  const handleUploadModalClose = () => {
    uploadModalShouldBeOpen.current = false;
    sessionStorage.removeItem('uploadModalOpen');
    setIsUploadModalOpen(false);
  };

  const handleUploadSuccess = (analyzedReceipt: AnalyzedReceipt) => {
    console.log('영수증 분석 완료:', analyzedReceipt);
    // 영수증 목록 새로고침
    loadReceipts();
  };

  // 업로드 완료 후 목록으로 이동
  const handleUploadComplete = () => {
    handleUploadModalClose();
    setActiveTab('list');
  };

  const handleReceiptSave = async (updatedReceipt: Receipt) => {
    try {
      // Google Sheets 업데이트
      await updateReceipt(updatedReceipt);

      // 로컬 상태 업데이트
      setReceipts((prevReceipts) =>
        prevReceipts.map((r) =>
          r.id === updatedReceipt.id ? updatedReceipt : r
        )
      );
    } catch (error) {
      console.error('영수증 저장 실패:', error);
      alert('영수증 저장에 실패했습니다.');
    }
  };

  const handleReceiptDelete = async (receiptId: string) => {
    try {
      // Google Sheets에서 삭제
      await deleteReceipt(receiptId);

      // 로컬 상태에서 제거
      setReceipts((prevReceipts) =>
        prevReceipts.filter((r) => r.id !== receiptId)
      );
    } catch (error) {
      console.error('영수증 삭제 실패:', error);
      alert('영수증 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      {/* 헤더 - 목록 탭일 때만 표시 */}
      {activeTab === 'list' && (
        <div className="bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">영수증 목록</h1>
            <button
              onClick={loadReceipts}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="새로고침"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 홈 화면 */}
      {activeTab === 'home' && (
        <div className="max-w-md mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="text-center">
            {/* 로고 아이콘 */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-14 h-14 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            {/* 타이틀 */}
            <h1 className="text-3xl font-bold text-gray-800 mb-2">영수증 관리</h1>
            <p className="text-gray-500 mb-4">Receipt Manager</p>
            {/* 버전 */}
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              v1.0
            </span>
            {/* 빠른 시작 버튼들 */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => setActiveTab('list')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-md"
              >
                영수증 목록 보기
              </button>
              <button
                onClick={handleCameraClick}
                className="w-full px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors"
              >
                새 영수증 스캔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 목록 화면 */}
      {activeTab === 'list' && (
        <div className="max-w-md mx-auto px-4 py-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          )}

          {/* 로딩 상태 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* 카테고리 필터 */}
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                {['전체', ...Array.from(new Set(receipts.map(r => r.구분).filter(Boolean)))].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-block px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                  >
                    {category}
                    {category !== '전체' && (
                      <span className="ml-1 text-xs opacity-75">
                        ({receipts.filter(r => r.구분 === category).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 영수증 목록 */}
              {(() => {
                const filteredReceipts = selectedCategory === '전체'
                  ? receipts
                  : receipts.filter(r => r.구분 === selectedCategory);

                return (
            <div className="space-y-4">
              {filteredReceipts.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500">영수증이 없습니다.</p>
                </div>
              ) : (
                filteredReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    onClick={() => handleReceiptClick(receipt)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {/* 구분에 따른 카테고리 아이콘 */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          receipt.구분 === '식대' ? 'bg-orange-100' :
                          receipt.구분 === '커피이용' ? 'bg-amber-100' :
                          receipt.구분 === '숙박비' ? 'bg-purple-100' :
                          receipt.구분 === '주차료' ? 'bg-slate-100' :
                          receipt.구분 === '충전료' ? 'bg-green-100' :
                          receipt.구분 === '교통비' ? 'bg-cyan-100' :
                          receipt.구분 === '톨게이트비용' ? 'bg-indigo-100' :
                          receipt.구분 === '마트' ? 'bg-emerald-100' :
                          receipt.구분 === '화장품' ? 'bg-pink-100' :
                          'bg-gray-100'
                        }`}>
                          {/* 식대 - 식기 아이콘 */}
                          {receipt.구분 === '식대' && (
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            </svg>
                          )}
                          {/* 커피이용 - 커피 아이콘 */}
                          {receipt.구분 === '커피이용' && (
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h1a4 4 0 110 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zm4-5v3m4-3v3m4-3v3" />
                            </svg>
                          )}
                          {/* 숙박비 - 호텔 아이콘 */}
                          {receipt.구분 === '숙박비' && (
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                          {/* 주차료 - 주차 아이콘 */}
                          {receipt.구분 === '주차료' && (
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m16 0V8a1 1 0 00-1-1h-4l-3 3v7" />
                            </svg>
                          )}
                          {/* 충전료 - 주유 아이콘 */}
                          {receipt.구분 === '충전료' && (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                          {/* 교통비 - 차 아이콘 */}
                          {receipt.구분 === '교통비' && (
                            <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4-9v2M6 21h12a2 2 0 002-2V9a2 2 0 00-2-2h-1l-1-2H8L7 7H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                          {/* 톨게이트비용 - 도로 아이콘 */}
                          {receipt.구분 === '톨게이트비용' && (
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          )}
                          {/* 마트 - 장바구니 아이콘 */}
                          {receipt.구분 === '마트' && (
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                          {/* 화장품 - 화장품 아이콘 */}
                          {receipt.구분 === '화장품' && (
                            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          )}
                          {/* 기타 - 기본 영수증 아이콘 */}
                          {!['식대', '커피이용', '숙박비', '주차료', '충전료', '교통비', '톨게이트비용', '마트', '화장품'].includes(receipt.구분) && (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>

                        {/* 영수증 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                            {receipt.이용지점}
                          </h3>
                          <div className="flex items-center text-xs text-gray-600 space-x-2 mb-2">
                            <span className="whitespace-nowrap">{receipt.거래일}</span>
                            {receipt.카드종류 && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="whitespace-nowrap">{receipt.카드종류}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {receipt.구분 && (
                              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                {receipt.구분}
                              </span>
                            )}
                            {receipt.청구대상여부 === 'O' && (
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                                청구대상
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 금액 */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold text-gray-900">
                          ₩{receipt.금액.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
                );
              })()}
          </>
        )}
        </div>
      )}

      {/* 통계 화면 */}
      {activeTab === 'stats' && (
        <div className="max-w-md mx-auto px-4 py-6" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          {/* 헤더 */}
          <h1 className="text-2xl font-bold text-gray-800 mb-6">지출 통계</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 총 지출 요약 카드 */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <p className="text-blue-100 text-sm mb-1">총 지출</p>
                <p className="text-3xl font-bold">
                  ₩{receipts.reduce((sum, r) => sum + (r.금액 || 0), 0).toLocaleString()}
                </p>
                <p className="text-blue-100 text-sm mt-2">
                  총 {receipts.length}건의 영수증
                </p>
              </div>

              {/* 카드종류별 통계 */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">카드종류별</h3>
                <div className="space-y-3">
                  {(() => {
                    const 법인 = receipts.filter(r => r.카드종류 === '법인카드');
                    const 개인 = receipts.filter(r => r.카드종류 === '개인카드');
                    const 법인합계 = 법인.reduce((sum, r) => sum + (r.금액 || 0), 0);
                    const 개인합계 = 개인.reduce((sum, r) => sum + (r.금액 || 0), 0);
                    const 총합계 = 법인합계 + 개인합계;
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                            <span className="text-gray-700">법인카드</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₩{법인합계.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{법인.length}건</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${총합계 > 0 ? (법인합계 / 총합계) * 100 : 0}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <span className="text-gray-700">개인카드</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₩{개인합계.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{개인.length}건</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${총합계 > 0 ? (개인합계 / 총합계) * 100 : 0}%` }}></div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* 청구대상 통계 */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">청구대상 여부</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const 청구대상 = receipts.filter(r => r.청구대상여부 === 'O');
                    const 비청구 = receipts.filter(r => r.청구대상여부 === 'X');
                    return (
                      <>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <p className="text-green-600 text-sm mb-1">청구대상</p>
                          <p className="text-xl font-bold text-green-700">
                            ₩{청구대상.reduce((sum, r) => sum + (r.금액 || 0), 0).toLocaleString()}
                          </p>
                          <p className="text-green-600 text-xs mt-1">{청구대상.length}건</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                          <p className="text-red-600 text-sm mb-1">비청구</p>
                          <p className="text-xl font-bold text-red-700">
                            ₩{비청구.reduce((sum, r) => sum + (r.금액 || 0), 0).toLocaleString()}
                          </p>
                          <p className="text-red-600 text-xs mt-1">{비청구.length}건</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* 구분별 통계 */}
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">카테고리별 지출</h3>
                <div className="space-y-3">
                  {(() => {
                    const categoryMap: { [key: string]: { count: number; total: number; color: string } } = {};
                    const colorMap: { [key: string]: string } = {
                      '식대': 'bg-orange-500',
                      '커피이용': 'bg-amber-500',
                      '숙박비': 'bg-purple-500',
                      '주차료': 'bg-slate-500',
                      '충전료': 'bg-green-500',
                      '교통비': 'bg-cyan-500',
                      '톨게이트비용': 'bg-indigo-500',
                      '마트': 'bg-emerald-500',
                      '화장품': 'bg-pink-500',
                    };

                    receipts.forEach(r => {
                      const cat = r.구분 || '기타';
                      if (!categoryMap[cat]) {
                        categoryMap[cat] = { count: 0, total: 0, color: colorMap[cat] || 'bg-gray-500' };
                      }
                      categoryMap[cat].count++;
                      categoryMap[cat].total += r.금액 || 0;
                    });

                    const sorted = Object.entries(categoryMap).sort((a, b) => b[1].total - a[1].total);
                    const maxTotal = sorted.length > 0 ? sorted[0][1].total : 1;

                    return sorted.map(([category, data]) => (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 ${data.color} rounded-full mr-3`}></div>
                            <span className="text-gray-700 text-sm">{category}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900 text-sm">₩{data.total.toLocaleString()}</span>
                            <span className="text-gray-500 text-xs ml-2">({data.count}건)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${data.color} h-2 rounded-full`} style={{ width: `${(data.total / maxTotal) * 100}%` }}></div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 내정보 화면 */}
      {activeTab === 'profile' && (
        <div className="max-w-md mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Cho samhyoung</h2>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-md mx-auto flex items-center justify-around py-3">
          {/* 홈 버튼 */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">홈</span>
          </button>

          {/* 목록 버튼 */}
          <button
            onClick={() => setActiveTab('list')}
            className={`flex flex-col items-center ${activeTab === 'list' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="text-xs mt-1">목록</span>
          </button>

          {/* 카메라 버튼 */}
          <button
            onClick={handleCameraClick}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center -mt-6 shadow-lg hover:bg-blue-700 transition-colors">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>

          {/* 통계 버튼 */}
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center ${activeTab === 'stats' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">통계</span>
          </button>

          {/* 내정보 버튼 */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">내정보</span>
          </button>
        </div>
      </div>

      {/* 영수증 상세 모달 */}
      <ReceiptDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receipt={selectedReceipt}
        onSave={handleReceiptSave}
        onDelete={handleReceiptDelete}
      />

      {/* 이미지 업로드 모달 */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleUploadModalClose}
        onSuccess={handleUploadSuccess}
        onComplete={handleUploadComplete}
      />
    </div>
  );
}

export default App;
