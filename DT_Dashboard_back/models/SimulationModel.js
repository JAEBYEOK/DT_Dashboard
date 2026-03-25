const mongoose = require('mongoose');

const simulationModelSchema = new mongoose.Schema({
  model_id: { type: String, required: true, unique: true, trim: true },
  model_name: { type: String, required: true, trim: true },
  file_path: { type: String, required: true, trim: true },
  layout_path: { type: String, trim: true },
  region: { type: String, default: '내포', trim: true },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  description: { type: String, trim: true },
}, {
  collection: 'SimulationModel',
  timestamps: true,
});

module.exports = mongoose.model('SimulationModel', simulationModelSchema);
