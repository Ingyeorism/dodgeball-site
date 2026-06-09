# 피구 재회 리그

Render 정적 사이트로 배포할 수 있는 React 앱입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## Render 배포 설정

- Service type: Static Site
- Build command: `npm install && npm run build`
- Publish directory: `dist`

## 15분 깨우기

`.github/workflows/keep-awake.yml`이 15분마다 배포 URL을 호출합니다.
GitHub 저장소 Secret에 `SITE_URL`을 Render 배포 URL로 추가해야 합니다.
