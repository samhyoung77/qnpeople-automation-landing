# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Python Selenium 프로젝트로 https://aice.study/main 웹사이트를 자동 테스트합니다.

## Build and Development Commands

### 초기 설정
```bash
pip install -r requirements.txt
```

### 테스트 실행
```bash
# 기본 테스트 실행
python test_aice_study.py

# pytest로 실행 (상세 출력)
pytest test_aice_study.py -v

# pytest로 실행 (출력 표시)
pytest test_aice_study.py -v -s
```

## Architecture Overview

- `test_aice_study.py` - 메인 테스트 스크립트
- `requirements.txt` - Python 의존성 목록
- Selenium WebDriver로 Chrome 브라우저 자동화
- webdriver-manager로 ChromeDriver 자동 관리

## Key Conventions

- Selenium 4.x 사용
- pytest 테스트 프레임워크 활용
- 테스트 실패 시 자동으로 스크린샷 캡처
- WebDriverWait로 동적 요소 로딩 대기
