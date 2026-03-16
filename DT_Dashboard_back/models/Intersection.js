const mongoose = require('mongoose');

const intersectionSchema = new mongoose.Schema({
  intersection_id: Number,
  intersection_name: String,
  latitude: Number,
  longitude: Number,
  phase_count: Number,
  intersection_image: String,
  // 새로운 필드 추가
  region: { type: String, default: '내포' }, // 예: '내포', '대전'
  region_coordinate: String // 예: "(36.67282,126.66241/36.63850,126.68897)"
});

module.exports = mongoose.model('Intersection', intersectionSchema);