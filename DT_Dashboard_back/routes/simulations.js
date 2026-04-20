const express = require('express');

const SimulationModel = require('../models/SimulationModel');
const Scenario = require('../models/Scenario');
const SimulationJob = require('../models/SimulationJob');
const { createSimulationJob } = require('../services/jobService');
const {
  syncVissimScenarioCatalog,
  syncComparisonSnapshots,
  processScenarioJob,
} = require('../services/vissimScenarioService');

const router = express.Router();

async function ensureScenarioCatalog() {
  const [modelCount, scenarioCount] = await Promise.all([
    SimulationModel.estimatedDocumentCount(),
    Scenario.estimatedDocumentCount(),
  ]);

  if (modelCount > 0 && scenarioCount > 0) {
    return;
  }

  await syncVissimScenarioCatalog();
  await syncComparisonSnapshots();
}

router.get('/vissim/models', async (req, res) => {
  try {
    await ensureScenarioCatalog();
    const models = await SimulationModel.find().sort({ status: 1, model_name: 1 });
    res.json(models);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/scenarios', async (req, res) => {
  try {
    await ensureScenarioCatalog();
    const query = {};

    if (req.query.model_id) query.model_id = req.query.model_id;
    if (req.query.scenario_type) query.scenario_type = req.query.scenario_type;
    if (req.query.time_period) query.time_period = req.query.time_period;

    const scenarios = await Scenario.find(query).sort({ scenario_name: 1 });
    res.json(scenarios);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/simulations', async (req, res) => {
  try {
    const { model_id, scenario_id } = req.body;

    if (!model_id || !scenario_id) {
      return res.status(400).json({ message: 'model_id와 scenario_id는 필수입니다.' });
    }

    const job = await createSimulationJob(req.body);
    processScenarioJob(job).catch((error) => {
      console.error(`[Simulation Job Error] ${job.job_id}:`, error.message);
    });

    res.status(201).json({
      job_id: job.job_id,
      status: job.status,
      progress: job.progress,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/simulations', async (req, res) => {
  try {
    const query = {};

    if (req.query.status) query.status = req.query.status;
    if (req.query.model_id) query.model_id = req.query.model_id;
    if (req.query.scenario_id) query.scenario_id = req.query.scenario_id;

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const jobs = await SimulationJob.find(query).sort({ createdAt: -1 }).limit(limit);

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/simulations/:jobId', async (req, res) => {
  try {
    const job = await SimulationJob.findOne({ job_id: req.params.jobId });

    if (!job) {
      return res.status(404).json({ message: '시뮬레이션 job을 찾을 수 없습니다.' });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
