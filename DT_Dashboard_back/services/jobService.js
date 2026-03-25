const SimulationJob = require('../models/SimulationJob');

function buildJobId() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  return `sim_${stamp}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function normalizeIntersectionIds(ids) {
  if (!Array.isArray(ids)) return [];

  return ids
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
}

async function createSimulationJob(payload) {
  const job = new SimulationJob({
    job_id: buildJobId(),
    model_id: payload.model_id,
    scenario_id: payload.scenario_id,
    intersection_ids: normalizeIntersectionIds(payload.intersection_ids),
    time_period: payload.time_period,
    requested_by: payload.requested_by || 'system',
    status: 'queued',
    progress: 0,
    log_message: 'Queued for runner',
  });

  return job.save();
}

module.exports = {
  createSimulationJob,
  normalizeIntersectionIds,
};
