/**
 * 마이캐 파츠 노트 - 백업 코드 동기화 서버 (Google Apps Script)
 * 내 구글 드라이브의 "aikatsu-parts-sync" 폴더에 백업 코드별로 목록과 사진을 저장해요.
 *
 * 배포: [배포] → [새 배포] → 유형 '웹 앱'
 *       다음 사용자 인증 정보로 실행: 나 / 액세스 권한이 있는 사용자: 모든 사용자
 * 배포 후 나오는 웹 앱 URL(…/exec)을 sync-config.js의 SYNC_GAS_URL에 넣으세요.
 */
const ROOT_NAME = 'aikatsu-parts-sync';
const CODE_RE = /^[A-Z0-9]{5}-[A-Z0-9]{5}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function props_() { return PropertiesService.getScriptProperties(); }

function root_() {
  const p = props_();
  const id = p.getProperty('ROOT_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder(ROOT_NAME);
  p.setProperty('ROOT_ID', f.getId());
  return f;
}
function codeFolder_(code, create) {
  const p = props_(), key = 'C_' + code;
  const id = p.getProperty(key);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  if (!create) return null;
  const f = root_().createFolder(code);
  p.setProperty(key, f.getId());
  return f;
}
function file_(folder, name) {
  const it = folder.getFilesByName(name);
  return it.hasNext() ? it.next() : null;
}
function read_(folder, name) {
  const f = file_(folder, name);
  return f ? JSON.parse(f.getBlob().getDataAsString('UTF-8')) : null;
}
function write_(folder, name, obj, desc) {
  const text = JSON.stringify(obj);
  let f = file_(folder, name);
  if (f) f.setContent(text); else f = folder.createFile(name, text, MimeType.PLAIN_TEXT);
  if (desc != null) f.setDescription(String(desc));
}
function checkCode_(code) { if (!CODE_RE.test(code || '')) throw new Error('bad code'); }
function checkId_(id) { if (!ID_RE.test(id || '')) throw new Error('bad id'); }

function doGet(e) {
  try {
    const q = e.parameter || {};
    if (!q.op) return out_({ ok: true, data: 'aikatsu-parts-sync ready' });
    checkCode_(q.code);
    const folder = codeFolder_(q.code, false);
    if (!folder) return out_({ ok: true, data: null });
    if (q.op === 'meta') return out_({ ok: true, data: read_(folder, 'meta.json') });
    if (q.op === 'rev') { const f = file_(folder, 'meta.json'); return out_({ ok: true, data: f ? f.getDescription() : null }); }
    if (q.op === 'img') { checkId_(q.id); return out_({ ok: true, data: read_(folder, 'img_' + q.id + '.json') }); }
    throw new Error('unknown op');
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const b = JSON.parse(e.postData.contents);
    checkCode_(b.code);
    lock.waitLock(20000);
    const folder = codeFolder_(b.code, true);
    if (b.op === 'setMeta') {
      if (!b.data || typeof b.data.rev !== 'string') throw new Error('bad data');
      write_(folder, 'meta.json', b.data, b.data.rev);
    } else if (b.op === 'setImg') {
      checkId_(b.id);
      write_(folder, 'img_' + b.id + '.json', b.data);
    } else if (b.op === 'delImg') {
      checkId_(b.id);
      const f = file_(folder, 'img_' + b.id + '.json');
      if (f) f.setTrashed(true);
    } else throw new Error('unknown op');
    return out_({ ok: true, data: true });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}
