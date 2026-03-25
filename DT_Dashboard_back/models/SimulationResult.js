const mongoose = require('mongoose');

const simulationResultSchema = new mongoose.Schema({
  job_id: { type: String, required: true, trim: true },
  model_id: { type: String, trim: true },
  scenario_id: { type: String, trim: true },
  intersection_id: { type: Number },
  total_volume: { type: Number, default: 0 },
  avg_speed: { type: Number, default: 0 },
  avg_delay: { type: Number, default: 0 },
  avg_travel_time: { type: Number, default: 0 },
  total_distance: { type: Number, default: 0 },
  max_queue_length: { type: Number, default: 0 },
  network_score: { type: Number, default: 0 },
}, {
  collection: 'SimulationResult',
  timestamps: true,
});

simulationResultSchema.index({ job_id: 1, intersection_id: 1 });

module.exports = mongoose.model('SimulationResult', simulationResultSchema);
