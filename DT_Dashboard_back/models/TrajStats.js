const mongoose = require('mongoose');

const trajStatsSchema = new mongoose.Schema({
  intersection_id   : { type: Number, required: true },
  vehicle_count     : { type: Number, default: 0 },
  avg_speed_kmh     : { type: Number, default: 0 },
  min_speed_kmh     : { type: Number, default: 0 },
  max_speed_kmh     : { type: Number, default: 0 },
  car_count         : { type: Number, default: 0 },
  van_count         : { type: Number, default: 0 },
  total_observations: { type: Number, default: 0 },
}, {
  collection: 'TrajStats'
});

module.exports = mongoose.model('TrajStats', trajStatsSchema);
