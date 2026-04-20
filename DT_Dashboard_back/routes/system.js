const express = require('express');

const SimulationJob = require('../models/SimulationJob');
const { parseVissimNetwork, normalizeName } = require('../services/vissimNetworkService');
const {
  syncVissimScenarioCatalog,
  syncComparisonSnapshots,
} = require('../services/vissimScenarioService');

const router = express.Router();

router.get('/system/runner-status', async (req, res) => {
  try {
    const [runningJob, queuedJob, latestJob] = await Promise.all([
      SimulationJob.findOne({ status: 'running' }).sort({ updatedAt: -1 }),
      SimulationJob.findOne({ status: 'queued' }).sort({ createdAt: -1 }),
      SimulationJob.findOne().sort({ updatedAt: -1 }),
    ]);

    if (runningJob) {
      return res.json({
        runner_status: 'running',
        last_seen_at: runningJob.updatedAt,
        active_job_id: runningJob.job_id,
      });
    }

    if (queuedJob) {
      return res.json({
        runner_status: 'queued',
        last_seen_at: queuedJob.updatedAt,
        active_job_id: queuedJob.job_id,
      });
    }

    res.json({
      runner_status: latestJob ? 'idle' : 'offline',
      last_seen_at: latestJob?.updatedAt || null,
      active_job_id: null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/system/vissim-network', async (req, res) => {
  try {
    const data = parseVissimNetwork(req.query.path);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/system/vissim-network/intersection', async (req, res) => {
  try {
    const { name } = req.query;
    const data = parseVissimNetwork(req.query.path);

    if (!name) {
      return res.status(400).json({ message: 'name query is required.' });
    }

    const normalizedQuery = normalizeName(name);
    const exactMatch = data.controllers.find(
      (controller) => controller.normalized_name === normalizedQuery
    );
    const partialMatches = data.controllers.filter((controller) =>
      controller.normalized_name.includes(normalizedQuery)
    );

    res.json({
      query: name,
      match: exactMatch || partialMatches[0] || null,
      candidates: partialMatches.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/system/vissim-sync', async (req, res) => {
  try {
    const catalog = await syncVissimScenarioCatalog();
    const comparison = await syncComparisonSnapshots();
    res.json({
      message: 'VISSIM scenario catalog synced successfully.',
      catalog,
      comparison,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
