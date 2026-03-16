const mongoose = require('mongoose');

//
// ▼▼▼ [수정됨] 실제 TravelTime.csv 파일 헤더와 100% 일치하는 스키마입니다. ▼▼▼
//
const travelTimeSchema = new mongoose.Schema({
  from_intersection_id: { type: Number }, // CSV 헤더: from_intersection_id
  to_intersection_id: { type: Number },   // CSV 헤더: to_intersection_id
  time_period: { type: Number },          // CSV 헤더: time_period
  travel_time: { type: Number },          // CSV 헤더: travel_time
  distance: { type: Number }              // CSV 헤더: distance
}, {
  // Compass 스크린샷에서 확인된 이름
  collection: 'TravelTime' 
});

module.exports = mongoose.model('TravelTime', travelTimeSchema);