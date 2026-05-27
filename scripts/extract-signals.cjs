const XLSX = require('xlsx');
const proj4 = require('proj4');

proj4.defs('EPSG:5186', '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs');

function toWGS84(x, y) {
  const [lng, lat] = proj4('EPSG:5186', 'WGS84', [x, y]);
  return {
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
  };
}

const wb = XLSX.readFile('서울특별시_자치구별 신호등 및 횡단보도 위치 및 현황_20230530.xlsx');

// 학교 좌표 기준 (TM): 광평로20길 63 일원동 부근
// 일원동 X: ~207000-208000, Y: ~542500-543500
const SCHOOL_X = 207300;
const SCHOOL_Y = 542900;
const RADIUS = 800; // 800m 반경

const sheet = wb.Sheets['보행등'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const signals = data.slice(4)
  .filter(r => {
    if (r[1] !== '강남구') return false;
    const x = Number(r[5]);
    const y = Number(r[6]);
    if (!x || !y) return false;
    const dist = Math.sqrt((x - SCHOOL_X) ** 2 + (y - SCHOOL_Y) ** 2);
    return dist < RADIUS;
  })
  .map(r => {
    const c = toWGS84(Number(r[5]), Number(r[6]));
    return { id: r[2], addr: r[4], lat: c.lat, lng: c.lng };
  });

console.log('학교 800m 반경 보행등:', signals.length, '개\n');
signals.forEach(s => console.log(JSON.stringify(s)));

// 학교 정문 좌표도 변환
const school = toWGS84(SCHOOL_X, SCHOOL_Y);
console.log('\n학교 중심 좌표 (근사):', school);
