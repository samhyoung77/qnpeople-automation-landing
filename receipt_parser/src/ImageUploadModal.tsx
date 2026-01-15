import React, { useState, useRef, useEffect } from 'react';
import { analyzeAndSaveReceipt, AnalyzedReceipt, UploadOptions } from './services/receiptAnalyzer';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (receipt: AnalyzedReceipt) => void;
  onComplete?: () => void;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onComplete,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(() => {
    // 초기화 시 sessionStorage에서 이미지 복원
    return sessionStorage.getItem('capturedImagePreview');
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzedReceipt | null>(null);
  const [cardType, setCardType] = useState<string>(() => sessionStorage.getItem('uploadCardType') || '');
  const [billable, setBillable] = useState<string>(() => sessionStorage.getItem('uploadBillable') || '');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // sessionStorage에서 이미지 복원 시 File 객체 재생성
  useEffect(() => {
    const savedPreview = sessionStorage.getItem('capturedImagePreview');
    if (savedPreview && !selectedImage) {
      // base64 데이터를 Blob으로 변환하여 File 객체 생성
      fetch(savedPreview)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
          setSelectedImage(file);
        })
        .catch(err => console.error('이미지 복원 실패:', err));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setError(null);
      setResult(null);

      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setImagePreview(preview);
        // sessionStorage에 이미지 저장 (카메라에서 돌아올 때 복원용)
        try {
          sessionStorage.setItem('capturedImagePreview', preview);
        } catch (err) {
          console.warn('이미지 저장 실패 (용량 초과 가능):', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('이미지를 먼저 선택해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const options: UploadOptions = {
        cardType: cardType || undefined,
        billable: billable || undefined,
      };
      const analyzedReceipt = await analyzeAndSaveReceipt(selectedImage, options);
      console.log('✅ 분석 완료된 영수증 데이터:', analyzedReceipt);
      setResult(analyzedReceipt);

      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess(analyzedReceipt);
      }
    } catch (err) {
      console.error('분석 실패:', err);
      setError('영수증 분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
    setResult(null);
    setCardType('');
    setBillable('');
    // sessionStorage 정리
    sessionStorage.removeItem('capturedImagePreview');
    sessionStorage.removeItem('uploadCardType');
    sessionStorage.removeItem('uploadBillable');
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  // 카드종류 변경 시 sessionStorage에도 저장
  const handleCardTypeChange = (value: string) => {
    setCardType(value);
    sessionStorage.setItem('uploadCardType', value);
  };

  // 청구대상여부 변경 시 sessionStorage에도 저장
  const handleBillableChange = (value: string) => {
    setBillable(value);
    sessionStorage.setItem('uploadBillable', value);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // 완료 버튼 클릭 시 (분석 완료 후)
  const handleComplete = () => {
    handleReset();
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">영수증 스캔</h2>
          <button
            onClick={handleClose}
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
          {/* 카메라 입력 (숨김) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          {/* 갤러리 입력 (숨김) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* 이미지 선택 영역 */}
          {!imagePreview ? (
            <div className="space-y-4">
              {/* 카메라 버튼 */}
              <button
                onClick={handleCameraClick}
                className="w-full py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center space-x-4"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-lg font-medium text-gray-700">카메라로 촬영</p>
                  <p className="text-sm text-gray-500">영수증을 직접 촬영합니다</p>
                </div>
              </button>

              {/* 갤러리 버튼 */}
              <button
                onClick={handleGalleryClick}
                className="w-full py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center space-x-4"
              >
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-lg font-medium text-gray-700">갤러리에서 선택</p>
                  <p className="text-sm text-gray-500">저장된 이미지를 선택합니다</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 이미지 미리보기 */}
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="선택된 영수증"
                  className="w-full rounded-xl shadow-md"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
                  title="다시 선택"
                >
                  <svg
                    className="w-5 h-5"
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

              {/* 카드종류 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카드종류
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleCardTypeChange('법인카드')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      cardType === '법인카드'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    법인카드
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCardTypeChange('개인카드')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      cardType === '개인카드'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    개인카드
                  </button>
                </div>
              </div>

              {/* 청구대상여부 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  청구대상여부
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleBillableChange('O')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      billable === 'O'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    O (청구대상)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBillableChange('X')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      billable === 'X'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    X (비청구)
                  </button>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* 분석 결과 */}
              {result && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                  <div className="flex items-center mb-2">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-semibold text-green-800">
                      분석 및 저장 완료!
                    </p>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    {result.이용지점 && (
                      <p>
                        <span className="font-medium">이용지점:</span>{' '}
                        {result.이용지점}
                      </p>
                    )}
                    {result.금액 !== undefined && result.금액 !== null && (
                      <p>
                        <span className="font-medium">금액:</span> ₩
                        {Number(result.금액).toLocaleString()}
                      </p>
                    )}
                    {result.거래일 && (
                      <p>
                        <span className="font-medium">거래일:</span>{' '}
                        {result.거래일}
                      </p>
                    )}
                    {result.구분 && (
                      <p>
                        <span className="font-medium">구분:</span> {result.구분}
                      </p>
                    )}
                    {result.카드종류 && (
                      <p>
                        <span className="font-medium">카드종류:</span>{' '}
                        {result.카드종류}
                      </p>
                    )}
                    {result.메모 && (
                      <p>
                        <span className="font-medium">메모:</span>{' '}
                        {result.메모}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 분석 버튼 */}
              {!result && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      분석 중...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      이미지 분석하기
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 bg-gray-50">
          {result ? (
            <button
              onClick={handleComplete}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
            >
              완료
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
