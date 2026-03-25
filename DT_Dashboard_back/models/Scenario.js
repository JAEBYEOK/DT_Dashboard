const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
  scenario_id: { type: String, required: true, unique: true, trim: true },
  scenario_name: { type: String, required: true, trim: true },
  scenario_type: {
    type: String,
    enum: ['base', 'option', 'route', 'signal'],
    default: 'base',
  },
  model_id: { type: String, trim: true },
  time_period: { type: String, trim: true },
  demand_level: { type: String, trim: true },
  signal_plan: { type: String, trim: true },
  route_plan: { type: String, trim: true },
  description: { type: String, trim: true },
}, {
  collection: 'Scenario',
  timestamps: true,
});

module.exports = mongoose.model('Scenario', scenarioSchema);
