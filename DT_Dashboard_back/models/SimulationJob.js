const mongoose = require('mongoose');

const simulationJobSchema = new mongoose.Schema({
  job_id: { type: String, required: true, unique: true, trim: true },
  model_id: { type: String, required: true, trim: true },
  scenario_id: { type: String, required: true, trim: true },
  intersection_ids: { type: [Number], default: [] },
  time_period: { type: String, trim: true },
  requested_by: { type: String, default: 'system', trim: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'done', 'failed'],
    default: 'queued',
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  log_message: { type: String, trim: true },
  error_message: { type: String, trim: true },
  started_at: { type: Date },
  finished_at: { type: Date },
}, {
  collection: 'SimulationJob',
  timestamps: true,
});

simulationJobSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SimulationJob', simulationJobSchema);
