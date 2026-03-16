const mongoose = require('mongoose');

const trafficDataSchema = new mongoose.Schema({
  // 1. 교차로 ID (필수)
  intersection_id: { 
    type: String, 
    required: true 
  },

  // 2. 방향 (필수)
  direction_eng: { 
    type: String, 
    required: true,
    enum: [
      "S-W", "S-N", "S-E",
      "E-S", "E-W", "E-N",
      "N-E", "N-S", "N-W",
      "W-N", "W-E", "W-S"
    ]
  },

  // 3. 날짜 (YYYY-MM-DD 형식의 문자열)
  date: { 
    type: String 
  },

  // 4. 시간대 (필수)
  time_period: { 
    type: String, 
    required: true 
  },

  // 5. 시뮬레이션 교통량
  vehs: { 
    type: Number 
  },

  // --- 실제 측정 데이터 (한글 필드명) ---
  "소계_대": { type: Number },
  "소형_승용": { type: Number },
  "버스_소형": { type: Number },
  "버스_대형": { type: Number },
  "화물_소형": { type: Number },
  "화물_중형": { type: Number },
  "화물_대형": { type: Number }
}, {
  // -----------------------------------------------------------------
  // ▼▼▼ 이 부분이 핵심입니다! ▼▼▼
  // CSV 파일명이 'TrafficData.csv'였으니 'TrafficData'일 확률이 높습니다.
  collection: 'TrafficData'
  // -----------------------------------------------------------------
});

module.exports = mongoose.model('TrafficData', trafficDataSchema);