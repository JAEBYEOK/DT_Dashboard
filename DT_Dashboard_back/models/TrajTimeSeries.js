const mongoose = require('mongoose');

const trajTimeSeriesSchema = new mongoose.Schema({
  intersection_id : { type: Number, required: true },
  time_start      : { type: Number, required: true },
  time_end        : { type: Number, required: true },
  vehicle_count   : { type: Number, default: 0 },
  avg_speed_kmh   : { type: Number, default: 0 },
  car_count       : { type: Number, default: 0 },
  van_count       : { type: Number, default: 0 },
}, {
  collection: 'TrajTimeSeries'
});

// 쿼리 최적화를 위한 인덱스
trajTimeSeriesSchema.index({ intersection_id: 1, time_start: 1 });

module.exports = mongoose.model('TrajTimeSeries', trajTimeSeriesSchema);
