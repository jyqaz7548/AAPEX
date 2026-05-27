const XLSX = require('xlsx');
const proj4 = require('proj4');

proj4.defs('EPSG:5186', '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs');

function toWGS84(x, y) {
  const [lng, lat] = proj4('EPSG:5186', 'WGS84', [x, y]);
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}

const wb = XLSX.readFile('서울특별시_자치구별 신호등 및 횡단보도 위치 및 현황_20230530.xlsx');
const sheet = wb.Sheets['보행등'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// 일원역 근처 신호등 - 교차로명에 일원 포함하거나 주소에 일원 포함
const nearby = data.slice(4).filter(r => {
  if (r[1] !== '강남구') return false;
  const addr = (r[4] || '').toString();
  // 일원역 TM 좌표 근사 (WGS84 37.4878, 127.0639 → TM)
  const x = Number(r[5]);
  const y = Number(r[6]);
  if (!x || !y) return false;
  const c = toWGS84(x, y);
  // 일원역 WGS84: 37.4878, 127.0639 기준 반경 400m
  const dLat = c.lat - 37.4878;
  const dLng = c.lng - 127.0639;
  const dist = Math.sqrt((dLat * 111000) ** 2 + (dLng * 88000) ** 2);
  return dist < 400;
});

console.log('일원역 400m 반경 보행등:', nearby.length, '개\n');
nearby.forEach(r => {
  const c = toWGS84(Number(r[5]), Number(r[6]));
  console.log(JSON.stringify({ lat: c.lat, lng: c.lng, addr: r[4], id: r[2] }));
});
