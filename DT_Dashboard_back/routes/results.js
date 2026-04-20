const express = require('express');

const SimulationComparison = require('../models/SimulationComparison');
const SimulationResult = require('../models/SimulationResult');
const IntersectionKpi = require('../models/IntersectionKpi');
const RouteResult = require('../models/RouteResult');
const TrajStats = require('../models/TrajStats');
const Scenario = require('../models/Scenario');
const { buildComparisonResponse } = require('../services/resultAggregator');
const { aggregateScenarioMetrics } = require('../services/vissimScenarioService');

const router = express.Router();

function buildScenarioSnapshot(metrics, intersectionId) {
  const targetIntersectionId = Number.isFinite(intersectionId) ? intersectionId : null;
  const intersectionRow =
    targetIntersectionId === null
      ? null
      : (metrics.intersections || []).find(
          (item) => Number(item.intersection_id) === targetIntersectionId
        ) || null;

  const network = metrics.network || {};

  return {
    intersection_id: targetIntersectionId ?? intersectionRow?.intersection_id ?? null,
    total_volume:
      intersectionRow?.total_volume !== undefined
        ? Number(intersectionRow.total_volume)
        : Number(network.total_volume || 0),
    avg_speed: Number(network.avg_speed || 0),
    avg_delay:
      intersectionRow?.avg_delay !== undefined
        ? Number(intersectionRow.avg_delay)
        : Number(network.avg_delay || 0),
    avg_travel_time: Number(network.avg_travel_time || 0),
    total_distance: Number(network.total_distance || 0),
  };
}

async function resolveScenarioIds(baseScenarioId, optionScenarioId) {
  const scenarioDocs = await Scenario.find().select('scenario_id scenario_name').lean();
  const byId = new Map(scenarioDocs.map((doc) => [doc.scenario_id, doc]));

  const baseId = baseScenarioId || 'S000001';

  let optionId = optionScenarioId;
  if (!optionId) {
    optionId =
      scenarioDocs
        .map((doc) => doc.scenario_id)
        .filter((scenarioId) => scenarioId !== baseId)
        .sort()
        .at(-1) || null;
  }

  return {
    baseId,
    optionId,
    baseName: byId.get(baseId)?.scenario_name || baseId,
    optionName: byId.get(optionId)?.scenario_name || optionId,
  };
}

router.get('/results/comparison', async (req, res) => {
  try {
    const {
      intersection_id,
      base_job_id,
      option_job_id,
      base_scenario_id,
      option_scenario_id,
    } = req.query;
    const numericIntersectionId = intersection_id ? Number(intersection_id) : null;

    if (base_job_id && option_job_id) {
      const query = {};
      if (Number.isFinite(numericIntersectionId)) query.intersection_id = numericIntersectionId;

      const [baseDoc, optionDoc] = await Promise.all([
        SimulationResult.findOne({ ...query, job_id: base_job_id }),
        SimulationResult.findOne({ ...query, job_id: option_job_id }),
      ]);

      return res.json(buildComparisonResponse(baseDoc || {}, optionDoc || {}));
    }

    if (base_scenario_id || option_scenario_id) {
      const { baseId, optionId, baseName, optionName } = await resolveScenarioIds(
        base_scenario_id,
        option_scenario_id
      );

      if (!optionId) {
        return res.status(400).json({ message: 'Option scenario could not be resolved.' });
      }

      const [baseMetrics, optionMetrics] = await Promise.all([
        aggregateScenarioMetrics(baseId),
        aggregateScenarioMetrics(optionId),
      ]);

      const baseDoc = buildScenarioSnapshot(baseMetrics, numericIntersectionId);
      const optionDoc = buildScenarioSnapshot(optionMetrics, numericIntersectionId);
      const payload = buildComparisonResponse(baseDoc, optionDoc);

      payload.scenario = {
        base_scenario_id: baseId,
        base_scenario_name: baseName,
        option_scenario_id: optionId,
        option_scenario_name: optionName,
      };

      return res.json(payload);
    }

    const query = Number.isFinite(numericIntersectionId)
      ? { intersection_id: numericIntersectionId }
      : {};
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
