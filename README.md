# Copilot Field Guide

StPageFlip을 사용한 **10페이지 반응형 Copilot 디지털 교육 교재**입니다. 별도 빌드 없이 정적 파일만으로 실행되며 GitHub Pages에 바로 배포할 수 있습니다.

## 주요 기능

- 실제 책처럼 드래그/클릭하여 넘기는 StPageFlip 효과
- 스마트폰 세로 화면에서 한 페이지 보기 + 좌우 스와이프
- 데스크톱 가로 화면에서 펼침 보기
- 이전/다음, 목차 바로가기, 키보드 방향키 이동
- 모션 줄이기, 진행률, 복사 가능한 실전 프롬프트
- 5분 퀴즈와 브라우저에 저장되는 7일 실천 체크리스트
- CDN 장애 시에도 내용을 읽을 수 있는 단순 페이지 보기 fallback
- 프레임워크·빌드 도구가 필요 없는 순수 HTML/CSS/JavaScript

## 로컬에서 확인

`index.html`을 직접 열 수도 있지만, 브라우저 보안 정책을 피하려면 간단한 로컬 서버를 권장합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 <http://localhost:8000>을 엽니다.

## GitHub Pages 배포

1. 이 폴더의 **내용 전체**를 GitHub 저장소 루트에 업로드합니다.
2. 저장소에서 **Settings → Pages**로 이동합니다.
3. **Build and deployment**에서 `Deploy from a branch`를 선택합니다.
4. 브랜치는 `main`, 폴더는 `/(root)`를 선택하고 저장합니다.
5. 잠시 뒤 표시되는 `https://<사용자명>.github.io/<저장소명>/` 주소로 접속합니다.

> 프로젝트 페이지처럼 하위 경로에 배포해도 동작하도록 모든 내부 경로는 상대 경로로 작성했습니다.

## 파일 구조

```text
.
├── index.html
├── .nojekyll
├── README.md
└── assets
    ├── app.js
    └── styles.css
```

## 콘텐츠 수정

- 각 페이지는 `index.html` 안의 `<article class="page">`입니다.
- 현재 정확히 10개 페이지이며 `data-title` 값이 목차에 자동 표시됩니다.
- 페이지 수를 바꾸면 JavaScript가 목차·진행률·표시 숫자를 자동 계산하지만, 페이지 본문에 적힌 `n / 10` 표시는 직접 고쳐야 합니다.
- 색상·레이아웃 토큰은 `assets/styles.css` 상단의 `:root`에서 조정할 수 있습니다.

## 외부 리소스

- [StPageFlip 2.0.7](https://github.com/Nodlik/StPageFlip) — MIT License, jsDelivr CDN 사용
- Google Fonts — Manrope, Noto Sans KR

인터넷 연결이 없으면 외부 폰트는 시스템 폰트로 대체됩니다. StPageFlip을 불러오지 못하면 사이트는 단순 페이지 보기 모드로 자동 전환됩니다.

## 브라우저 지원

최신 Chrome, Edge, Firefox, Safari 및 iOS/Android의 최신 브라우저를 권장합니다.
