const mongoose = require('mongoose');

const routeResultSchema = new mongoose.Schema({
  job_id: { type: String, required: true, trim: true },
  route_id: { type: String, required: true, trim: true },
  origin: { type: String, trim: true },
  destination: { type: String, trim: true },
  scenario_id: { type: String, trim: true },
  travel_time: { type: Number, default: 0 },
  delay: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
  avg_speed: { type: Number, default: 0 },
  recommended: { type: Boolean, default: false },
}, {
  collection: 'RouteResult',
  timestamps: true,
});

routeResultSchema.index({ job_id: 1, origin: 1, destination: 1 });

module.exports = mongoose.model('RouteResult', routeResultSchema);
