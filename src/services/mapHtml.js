export const buildMapHtml = (clientId) => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>MoveSync</title>
  <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;font-family:-apple-system,sans-serif}
    #map{width:100%;height:100%}
    #panel{position:fixed;bottom:0;left:0;right:0;background:#fff;border-radius:16px 16px 0 0;
      padding:20px;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px));
      box-shadow:0 -4px 16px rgba(0,0,0,.15);transform:translateY(100%);transition:transform .3s ease}
    #panel.open{transform:translateY(0)}
    .close-btn{position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:50%;
      background:#e5e7eb;border:none;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    #panel-title{font-size:16px;font-weight:700;margin-bottom:14px;padding-right:36px;color:#111}
    #signal-display{display:flex;align-items:center;gap:16px;margin-bottom:8px}
    #signal-circle{width:64px;height:64px;border-radius:50%;background:#ccc;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;font-size:28px;transition:background .4s}
    #signal-circle.green{background:#22c55e}
    #signal-circle.red{background:#ef4444}
    #signal-info{flex:1}
    #signal-status{font-size:17px;font-weight:700}
    #signal-remaining{font-size:44px;font-weight:800;color:#111;line-height:1.05}
    #signal-unit{font-size:13px;color:#666;margin-top:2px}
    #progress-wrap{margin:8px 0 4px}
    #progress-bg{height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden}
    #progress-fill{height:100%;border-radius:3px;transition:width .9s linear,background .4s}
    #signal-auto{font-size:11px;color:#aaa;margin-top:4px}
    .gear-btn{position:absolute;bottom:calc(20px + env(safe-area-inset-bottom,0px));right:20px;
      width:32px;height:32px;border-radius:50%;background:#f3f4f6;border:none;font-size:17px;cursor:pointer}
    #settings-view{display:none}
    .back-btn{background:none;border:none;color:#007AFF;font-size:14px;cursor:pointer;margin-bottom:12px;padding:0}
    .s-label{font-size:12px;color:#888;margin-bottom:3px}
    .s-row{margin-bottom:10px}
    .s-input{width:100%;padding:9px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:15px}
    .btn{width:100%;padding:11px 0;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;margin-top:6px}
    .btn-green{background:#22c55e;color:#fff}
    .btn-blue{background:#3b82f6;color:#fff}
    .toast{position:fixed;bottom:calc(80px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);
      background:#111;color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap}
    .toast.show{opacity:1}
    #fab{position:fixed;bottom:calc(24px + env(safe-area-inset-bottom,0px));right:16px;
      width:52px;height:52px;border-radius:50%;background:#007AFF;color:#fff;border:none;
      font-size:28px;box-shadow:0 4px 12px rgba(0,0,0,.25);cursor:pointer;z-index:100;
      display:flex;align-items:center;justify-content:center;transition:background .2s;line-height:1}
    #fab.cancel{background:#ef4444}
    #place-hint{position:fixed;top:16px;left:50%;transform:translateX(-50%);
      background:#111;color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;
      display:none;z-index:100;pointer-events:none;white-space:nowrap}
    #dim{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:150;display:none}
    #name-dialog{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);
      background:#fff;border-radius:16px;padding:20px;width:284px;z-index:200;
      box-shadow:0 8px 32px rgba(0,0,0,.2);display:none}
    #name-dialog p{font-size:15px;font-weight:700;color:#111;margin-bottom:8px}
    #sig-name{width:100%;padding:9px 10px;border:1px solid #d1d5db;border-radius:8px;
      font-size:15px;margin-bottom:12px;box-sizing:border-box}
    .dlg-row{display:flex;gap:8px}
    .dlg-btn{flex:1;padding:10px 0;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
    .dlg-ok{background:#007AFF;color:#fff}
    .dlg-cancel{background:#e5e7eb;color:#333}
  </style>
</head>
<body>
<div id="map"></div>
<div id="panel">
  <button class="close-btn" onclick="closePanel()">✕</button>
  <div id="panel-title"></div>

  <div id="signal-view">
    <div id="signal-display">
      <div id="signal-circle">🚦</div>
      <div id="signal-info">
        <div id="signal-status" style="color:#333">로딩 중...</div>
        <div id="signal-remaining">--</div>
        <div id="signal-unit">초 남음</div>
      </div>
    </div>
    <div id="progress-wrap"><div id="progress-bg"><div id="progress-fill" style="width:0%;background:#e5e7eb"></div></div></div>
    <div id="signal-auto">1초마다 자동 갱신</div>
  </div>

  <div id="settings-view">
    <button class="back-btn" onclick="showSignalView()">← 돌아가기</button>
    <div class="s-row"><div class="s-label">신호 주기 (초)</div><input class="s-input" id="inp-cycle" type="number" /></div>
    <div class="s-row"><div class="s-label">초록불 유지 시간 (초)</div><input class="s-input" id="inp-green" type="number" /></div>
    <button class="btn btn-green" onclick="setNowRef()">🟢 지금 초록불 시작 시각으로 설정</button>
    <button class="btn btn-blue" onclick="saveCycle()">저장</button>
  </div>

  <button class="gear-btn" id="gear-btn" onclick="showSettings()">⚙️</button>
</div>
<div class="toast" id="toast"></div>

<button id="fab" onclick="togglePlace()">+</button>
<div id="place-hint">📍 지도를 탭해 위치 선택</div>
<div id="dim" onclick="cancelPlace()"></div>
<div id="name-dialog">
  <p>🚦 신호등 이름</p>
  <input id="sig-name" type="text" placeholder="예: 강남역 1번 출구 횡단보도" />
  <div class="dlg-row">
    <button class="dlg-btn dlg-cancel" onclick="cancelPlace()">취소</button>
    <button class="dlg-btn dlg-ok" onclick="confirmPlace()">추가</button>
  </div>
</div>

<script>
  let currentId=null, refreshTimer=null, cycleInfo={cycleSeconds:170,greenSeconds:40};
  let placing=false, pendingCoord=null;
  const markerMap={}; // itstId → naver.maps.Marker

  const map=new naver.maps.Map('map',{center:new naver.maps.LatLng(37.48327,127.0838),zoom:16,mapDataControl:false,scaleControl:false});
  // RN 앱 환경에서는 네이티브 FAB 버튼 사용 → HTML FAB 숨김
  if(window.ReactNativeWebView){document.getElementById('fab').style.display='none';}

  naver.maps.Event.addListener(map,'click',function(e){
    if(!placing)return;
    pendingCoord=e.coord;
    document.getElementById('sig-name').value='';
    document.getElementById('name-dialog').style.display='block';
    document.getElementById('dim').style.display='block';
  });

  async function init(){
    const r=await fetch('/api/signals');
    const {signals}=await r.json();
    signals.forEach(addMarker);
  }

  function addMarker(sig){
    const m=new naver.maps.Marker({position:new naver.maps.LatLng(sig.lat,sig.lng),map,title:sig.name,
      icon:{content:'<div style="background:#007AFF;color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.3)">'+sig.name+'</div>',anchor:new naver.maps.Point(0,28)}});
    markerMap[sig.itstId]=m;
    naver.maps.Event.addListener(m,'click',()=>{
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'markerClick',signal:sig}));
      } else {
        openPanel(sig);
      }
    });
  }

  function removeMarker(itstId){
    if(markerMap[itstId]){markerMap[itstId].setMap(null);delete markerMap[itstId];}
  }

  function togglePlace(){
    placing=!placing;
    const fab=document.getElementById('fab');
    fab.textContent=placing?'✕':'+';
    fab.className=placing?'cancel':'';
    document.getElementById('place-hint').style.display=placing?'block':'none';
    if(!placing){document.getElementById('name-dialog').style.display='none';document.getElementById('dim').style.display='none';pendingCoord=null;}
  }

  function cancelPlace(){
    placing=false;
    const fab=document.getElementById('fab');
    fab.textContent='+';fab.className='';
    document.getElementById('place-hint').style.display='none';
    document.getElementById('name-dialog').style.display='none';
    document.getElementById('dim').style.display='none';
    pendingCoord=null;
    if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify({type:'placingCancelled'}));}
  }

  async function confirmPlace(){
    const name=document.getElementById('sig-name').value.trim();
    if(!name){showToast('이름을 입력해주세요');return;}
    if(!pendingCoord){cancelPlace();return;}
    const body={name,lat:pendingCoord.lat(),lng:pendingCoord.lng()};
    const r=await fetch('/api/signals',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const data=await r.json();
    addMarker(data.signal);
    cancelPlace();
    showToast(name+' 추가됐어요!');
  }

  function openPanel(sig){
    currentId=sig.itstId;
    document.getElementById('panel-title').textContent=sig.name;
    showSignalView();
    document.getElementById('panel').classList.add('open');
    loadRemaining();
    clearInterval(refreshTimer);
    refreshTimer=setInterval(loadRemaining,1000);
  }

  async function loadRemaining(){
    if(!currentId)return;
    try{
      const r=await fetch('/api/signals/'+currentId+'/remaining');
      const data=await r.json();
      const sig=(data.signals||[]).find(s=>!s.unavailable);
      if(!sig){renderError('신호 정보 없음');return;}
      if(data.cycleInfo)cycleInfo=data.cycleInfo;
      const isGreen=sig.statusName==='green';
      const circle=document.getElementById('signal-circle');
      circle.textContent=isGreen?'🟢':'🔴';
      circle.className=isGreen?'green':'red';
      document.getElementById('signal-status').textContent=isGreen?'초록불':'빨간불';
      document.getElementById('signal-status').style.color=isGreen?'#16a34a':'#dc2626';
      document.getElementById('signal-remaining').textContent=Math.ceil(sig.remainingSeconds);
      const total=isGreen?cycleInfo.greenSeconds:(cycleInfo.cycleSeconds-cycleInfo.greenSeconds);
      const pct=Math.min(100,(sig.remainingSeconds/total)*100);
      const fill=document.getElementById('progress-fill');
      fill.style.width=pct+'%';
      fill.style.background=isGreen?'#22c55e':'#ef4444';
    }catch{renderError('조회 실패');}
  }

  function renderError(msg){
    document.getElementById('signal-circle').textContent='⚠️';
    document.getElementById('signal-circle').className='';
    document.getElementById('signal-status').textContent=msg;
    document.getElementById('signal-remaining').textContent='--';
    document.getElementById('progress-fill').style.width='0%';
  }

  function showSignalView(){
    document.getElementById('signal-view').style.display='block';
    document.getElementById('settings-view').style.display='none';
    document.getElementById('gear-btn').style.display='';
  }

  function showSettings(){
    document.getElementById('inp-cycle').value=cycleInfo.cycleSeconds;
    document.getElementById('inp-green').value=cycleInfo.greenSeconds;
    document.getElementById('signal-view').style.display='none';
    document.getElementById('settings-view').style.display='block';
    document.getElementById('gear-btn').style.display='none';
  }

  function getNowKST(){const n=new Date();const h=(n.getUTCHours()+9)%24;return String(h).padStart(2,'0')+':'+String(n.getUTCMinutes()).padStart(2,'0')+':'+String(n.getUTCSeconds()).padStart(2,'0');}

  async function setNowRef(){
    if(!currentId)return;
    const ref=getNowKST();
    const c=parseInt(document.getElementById('inp-cycle').value)||cycleInfo.cycleSeconds;
    const g=parseInt(document.getElementById('inp-green').value)||cycleInfo.greenSeconds;
    await fetch('/api/signals/'+currentId+'/cycle',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cycleSeconds:c,greenSeconds:g,referenceGreenStartKST:ref})});
    showToast('기준 시각 '+ref+' KST로 설정됨');
    showSignalView();
  }

  async function saveCycle(){
    if(!currentId)return;
    const c=parseInt(document.getElementById('inp-cycle').value);
    const g=parseInt(document.getElementById('inp-green').value);
    if(!c||!g){showToast('값을 입력해주세요');return;}
    await fetch('/api/signals/'+currentId+'/cycle',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cycleSeconds:c,greenSeconds:g})});
    showToast('저장됐어요');
    showSignalView();
  }

  function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}

  function closePanel(){
    clearInterval(refreshTimer);refreshTimer=null;currentId=null;
    document.getElementById('panel').classList.remove('open');
    showSignalView();
  }

  init();
</script>
</body>
</html>`;
