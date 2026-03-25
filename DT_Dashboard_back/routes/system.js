const express = require('express');

const SimulationJob = require('../models/SimulationJob');

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

module.exports = router;
