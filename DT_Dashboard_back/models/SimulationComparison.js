const mongoose = require('mongoose');

//
// ▼▼▼ [수정됨] 실제 SimulationComparison.csv / Compass 스크린샷과 100% 일치하는 스키마입니다. ▼▼▼
//
const simulationComparisonSchema = new mongoose.Schema({
  intersection_id: { type: Number },    // 교차로 ID
  scenario_name: { type: String },      // CSV 헤더: scenario_name
  total_volume: { type: Number },       // CSV 헤더: total_volume
  unserved_vehicles: { type: Number },  // CSV 헤더: unserved_vehicles
  avg_speed: { type: Number },          // CSV 헤더: avg_speed
  avg_delay: { type: Number },          // CSV 헤더: avg_delay
  avg_travel_time: { type: Number },    // CSV 헤더: avg_travel_time
  total_distance: { type: Number }      // CSV 헤더: total_distance
}, {
  // Compass 스크린샷에서 확인된 이름
  collection: 'SimulationComparison' 
});

module.exports = mongoose.model('SimulationComparison', simulationComparisonSchema);