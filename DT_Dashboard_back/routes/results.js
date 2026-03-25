const express = require('express');

const SimulationComparison = require('../models/SimulationComparison');
const SimulationResult = require('../models/SimulationResult');
const IntersectionKpi = require('../models/IntersectionKpi');
const RouteResult = require('../models/RouteResult');
const TrajStats = require('../models/TrajStats');
const { buildComparisonResponse } = require('../services/resultAggregator');

const router = express.Router();

router.get('/results/comparison', async (req, res) => {
  try {
    const { intersection_id, base_job_id, option_job_id } = req.query;

    if (base_job_id && option_job_id) {
      const query = {};
      if (intersection_id) query.intersection_id = Number(intersection_id);

      const [baseDoc, optionDoc] = await Promise.all([
        SimulationResult.findOne({ ...query, job_id: base_job_id }),
        SimulationResult.findOne({ ...query, job_id: option_job_id }),
      ]);

      return res.json(buildComparisonResponse(baseDoc || {}, optionDoc || {}));
    }

    const query = intersection_id ? { intersection_id: Number(intersection_id) } : {};
    const docs = await SimulationComparison.find(query);
    const baseDoc = docs.find((doc) => doc.scenario_name === 'Base');
    const optionDoc = docs.find((doc) => doc.scenario_name === 'Option');

    res.json(buildComparisonResponse(baseDoc || {}, optionDoc || {}));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/results/intersections', async (req, res) => {
  try {
    const { job_id } = req.query;

    if (job_id) {
      const docs = await IntersectionKpi.find({ job_id }).sort({ intersection_id: 1 });
      return res.json(docs);
    }

    const docs = await TrajStats.find().sort({ intersection_id: 1 });
    const fallback = docs.map((doc) => ({
      intersection_id: doc.intersection_id,
      intersection_name: doc.intersection_name,
      avg_delay: 0,
      avg_speed: doc.avg_speed_kmh,
      queue_length: 0,
      max_queue_length: 0,
      throughput: doc.vehicle_count,
      vc_ratio: 0,
      los: 'N/A',
    }));

    res.json(fallback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/results/intersections/:intersectionId', async (req, res) => {
  try {
    const intersectionId = Number(req.params.intersectionId);
    const { job_id } = req.query;

    if (job_id) {
      const doc = await IntersectionKpi.findOne({
        job_id,
        intersection_id: intersectionId,
      });

      if (!doc) {
        return res.status(404).json({ message: '교차로 KPI를 찾을 수 없습니다.' });
      }

      return res.json(doc);
    }

    const doc = await TrajStats.findOne({ intersection_id: intersectionId });

    if (!doc) {
      return res.status(404).json({ message: '교차로 결과를 찾을 수 없습니다.' });
    }

    res.json({
      intersection_id: doc.intersection_id,
      intersection_name: doc.intersection_name,
      avg_delay: 0,
      avg_speed: doc.avg_speed_kmh,
      queue_length: 0,
      max_queue_length: 0,
      throughput: doc.vehicle_count,
      vc_ratio: 0,
      los: 'N/A',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/results/routes', async (req, res) => {
  try {
    const query = {};
    if (req.query.job_id) query.job_id = req.query.job_id;
    if (req.query.origin) query.origin = req.query.origin;
    if (req.query.destination) query.destination = req.query.destination;
    if (req.query.scenario_id) query.scenario_id = req.query.scenario_id;

    const docs = await RouteResult.find(query).sort({ recommended: -1, createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
