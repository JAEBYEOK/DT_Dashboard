const mongoose = require('mongoose');

const intersectionKpiSchema = new mongoose.Schema({
  job_id: { type: String, required: true, trim: true },
  intersection_id: { type: Number, required: true },
  intersection_name: { type: String, trim: true },
  avg_delay: { type: Number, default: 0 },
  avg_speed: { type: Number, default: 0 },
  queue_length: { type: Number, default: 0 },
  max_queue_length: { type: Number, default: 0 },
  throughput: { type: Number, default: 0 },
  vc_ratio: { type: Number, default: 0 },
  los: { type: String, default: 'A', trim: true },
  signal_cycle: { type: Number, default: 0 },
}, {
  collection: 'IntersectionKpi',
  timestamps: true,
});

intersectionKpiSchema.index({ job_id: 1, intersection_id: 1 }, { unique: true });

module.exports = mongoose.model('IntersectionKpi', intersectionKpiSchema);
