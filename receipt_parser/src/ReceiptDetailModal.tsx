import React, { useState, useEffect } from 'react';
import { Receipt } from './types/receipt';

interface ReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt?: Receipt;
  onSave?: (updatedReceipt: Receipt) => void;
  onDelete?: (receiptId: string) => void;
}

const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  isOpen,
  onClose,
  receipt,
  onSave,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    id: receipt?.id || '',
    image: receipt?.image || '',
    거래일: receipt?.거래일 || '',
    청구대상여부: receipt?.청구대상여부 || '',
    구분: receipt?.구분 || '',
    이용지점: receipt?.이용지점 || '',
    금액: receipt?.금액 || 0,
    카드종류: receipt?.카드종류 || '',
    메모: receipt?.메모 || '',
    비고: receipt?.비고 || '',
    url: receipt?.url || '',
  });

  // receipt prop이 변경될 때 formData 업데이트
  useEffect(() => {
    if (receipt) {
      setFormData({
        id: receipt.id || '',
        image: receipt.image || '',
        거래일: receipt.거래일 || '',
        청구대상여부: receipt.청구대상여부 || '',
        구분: receipt.구분 || '',
        이용지점: receipt.이용지점 || '',
        금액: receipt.금액 || 0,
        카드종류: receipt.카드종류 || '',
        메모: receipt.메모 || '',
        비고: receipt.비고 || '',
        url: receipt.url || '',
      });
    }
  }, [receipt]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === '금액') {
      // 빈 값이면 0으로 설정
      if (value === '') {
        setFormData((prev) => ({ ...prev, [name]: 0 }));
        return;
      }
      // 앞의 0 제거 후 숫자로 변환 (예: "012" -> 12)
      const numValue = parseInt(value, 10);
      setFormData((prev) => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData as Receipt);
    }
    onClose();
  };

  // 취소 시 원래 값으로 복원
  const handleCancel = () => {
    if (receipt) {
      setFormData({
        id: receipt.id || '',
        image: receipt.image || '',
        거래일: receipt.거래일 || '',
        청구대상여부: receipt.청구대상여부 || '',
        구분: receipt.구분 || '',
        이용지점: receipt.이용지점 || '',
        금액: receipt.금액 || 0,
        카드종류: receipt.카드종류 || '',
        메모: receipt.메모 || '',
        비고: receipt.비고 || '',
        url: receipt.url || '',
      });
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  // 삭제 확인
  const handleDelete = () => {
    if (onDelete && formData.id) {
      onDelete(formData.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleCancel}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Receipt Manager</h2>
          <button
            onClick={handleCancel}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* 영수증 이미지 또는 아이콘 */}
          <div className="flex justify-center mb-4">
            {formData.image ? (
              <a
                href={formData.url || formData.image}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={(() => {
                    const img = formData.image;
                    // Google Drive URL에서 파일 ID 추출 후 썸네일 URL로 변환
                    if (img.includes('drive.google.com')) {
                      let fileId = '';
                      // /file/d/FILE_ID/view 형식
                      const match1 = img.match(/\/file\/d\/([^/]+)/);
                      // /uc?export=view&id=FILE_ID 형식
                      const match2 = img.match(/[?&]id=([^&]+)/);
                      // /d/FILE_ID 형식
                      const match3 = img.match(/\/d\/([^/]+)/);
                      fileId = match1?.[1] || match2?.[1] || match3?.[1] || '';
                      if (fileId) {
                        return `https://lh3.googleusercontent.com/d/${fileId}`;
                      }
                    }
                    return img;
                  })()}
                  alt="영수증"
                  className="w-48 h-48 object-contain rounded-lg shadow-md bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                  onError={(e) => {
                    // 이미지 로드 실패시 기본 아이콘으로 대체
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </a>
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
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
            )}
          </div>

          {/* ID (읽기 전용) */}
          {formData.id && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                ID
              </label>
              <div className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm">
                {formData.id}
              </div>
            </div>
          )}

          {/* 이용지점 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이용지점
            </label>
            <input
              type="text"
              name="이용지점"
              value={formData.이용지점}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-semibold"
            />
          </div>

          {/* 금액 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              금액
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-bold text-gray-700">
                ₩
              </span>
              <input
                type="number"
                name="금액"
                value={formData.금액}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-bold"
              />
            </div>
          </div>

          {/* 거래일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="inline-flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                거래일
              </span>
            </label>
            <input
              type="text"
              name="거래일"
              value={formData.거래일}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* 구분 (카테고리) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              구분
            </label>
            <input
              type="text"
              name="구분"
              value={formData.구분}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            {formData.구분 && (
              <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                  {formData.구분}
                </span>
              </div>
            )}
          </div>

          {/* 카드종류 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="inline-flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                카드종류
              </span>
            </label>
            <select
              name="카드종류"
              value={formData.카드종류}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="">선택하세요</option>
              <option value="법인카드">법인카드</option>
              <option value="개인카드">개인카드</option>
            </select>
          </div>

          {/* 청구대상여부 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              청구대상여부
            </label>
            <select
              name="청구대상여부"
              value={formData.청구대상여부}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="">선택하세요</option>
              <option value="O">O</option>
              <option value="X">X</option>
            </select>
            {formData.청구대상여부 === 'O' && (
              <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                  청구대상
                </span>
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모
            </label>
            <textarea
              name="메모"
              value={formData.메모}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {/* 비고 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비고
            </label>
            <textarea
              name="비고"
              value={formData.비고}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 bg-gray-50">
          {showDeleteConfirm ? (
            // 삭제 확인 UI
            <div className="space-y-3">
              <p className="text-center text-red-600 font-medium">
                이 영수증을 삭제하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  아니오
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            // 기본 버튼 UI
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
                >
                  저장
                </button>
              </div>
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-3 bg-white text-red-600 border border-red-300 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  영수증 삭제
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailModal;
