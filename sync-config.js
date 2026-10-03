// 백업 코드(기기 연결) 기능을 위한 저장소 설정이에요. 아래 셋 중 하나만 채우면 돼요.

// ① Cloud Firestore (Firebase) — console.cloud.google.com/firestore 에서 만든 데이터베이스
//    projectId: 프로젝트 ID (예: aikatsu-parts-12345). 콘솔 맨 위 프로젝트 선택 상자에서 확인할 수 있어요.
//    databaseId: 데이터베이스 ID. 무료 사용량은 '(default)'에만 적용되니 그대로 두는 걸 추천해요.
window.SYNC_FIRESTORE = {
  projectId: '',
  databaseId: '(default)'
};

// ② 구글 드라이브 (Google Apps Script) 웹 앱 주소 (…/exec)
window.SYNC_GAS_URL = '';

// ③ Firebase Realtime Database 주소
window.SYNC_DB_URL = '';

// 모두 비워 두면 백업 코드 기능만 꺼지고, 나머지 기능은 그대로 쓸 수 있어요.
