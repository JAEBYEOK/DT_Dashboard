const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const SimulationModel = require('../models/SimulationModel');
const Scenario = require('../models/Scenario');
const SimulationResult = require('../models/SimulationResult');
const IntersectionKpi = require('../models/IntersectionKpi');
const Intersection = require('../models/Intersection');
const SimulationComparison = require('../models/SimulationComparison');
const SimulationJob = require('../models/SimulationJob');

function pickDefaultVissimBaseDir() {
  const candidates = [
    process.env.VISSIM_BASE_DIR,
    path.join(process.cwd(), 'VIssim'),
    path.join(process.cwd(), 'data'),
    '/opt/render/project/src/VIssim',
    '/opt/render/project/src/DT_Dashboard_back/data',
    path.join(process.env.USERPROFILE || 'C:\\Users\\kaistys', 'Desktop', 'VIssim'),
  ].filter(Boolean);

  const matched = candidates.find((candidatePath) => {
    try {
      return fs.existsSync(candidatePath);
    } catch {
      return false;
    }
  });

  return matched || candidates[0];
}

const DEFAULT_VISSIM_BASE_DIR = pickDefaultVissimBaseDir();
const DEFAULT_VISSIM_PYTHON_BIN = process.env.VISSIM_PYTHON_BIN || 'python';
const DEFAULT_MODEL_ID = process.env.VISSIM_MODEL_ID || 'vissim_practice';
const DEFAULT_OPTION_SCENARIO_ID = process.env.VISSIM_OPTION_SCENARIO_ID || '';

const READER_SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'vissim_reader.py');

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function computeLos(avgDelaySec) {
  const delay = toNumber(avgDelaySec, 0);
  if (delay <= 10) return 'A';
  if (delay <= 20) return 'B';
  if (delay <= 35) return 'C';
  if (delay <= 55) return 'D';
  if (delay <= 80) return 'E';
  return 'F';
}

function runVissimReader(command, { baseDir = DEFAULT_VISSIM_BASE_DIR, scenarioId } = {}) {
  const args = [READER_SCRIPT_PATH, command, '--base-dir', baseDir];
  if (scenarioId) {
    args.push('--scenario-id', scenarioId);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(DEFAULT_VISSIM_PYTHON_BIN, args, {
      cwd: path.dirname(READER_SCRIPT_PATH),
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr.trim() || `vissim_reader.py failed with exit code ${code}`));
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Failed to parse vissim_reader.py output: ${error.message}`));
      }
    });
  });
}

function normalizeScenarioType(rawType, scenarioId, scenarioName) {
  if (rawType === 'base' || rawType === 'option' || rawType === 'route' || rawType === 'signal') {
    return rawType;
  }

  if (scenarioId === 'S000001') return 'base';
  if (/base/i.test(scenarioName || '')) return 'base';
  return 'option';
}

function pickOptionScenarioId(scenarios = []) {
  if (DEFAULT_OPTION_SCENARIO_ID) {
    const exists = scenarios.some((scenario) => scenario.scenario_id === DEFAULT_OPTION_SCENARIO_ID);
    if (exists) return DEFAULT_OPTION_SCENARIO_ID;
  }

  const nonBase = scenarios.filter((scenario) => scenario.scenario_id !== 'S000001');
  if (nonBase.length === 0) return null;

  return nonBase
    .map((scenario) => scenario.scenario_id)
    .sort()
    .at(-1);
}

async function ensureVissimModel(baseDir = DEFAULT_VISSIM_BASE_DIR) {
  return SimulationModel.findOneAndUpdate(
    { model_id: DEFAULT_MODEL_ID },
    {
      model_name: 'VISSIM Practice Model',
      file_path: path.join(baseDir, 'practice.inpx'),
      layout_path: path.join(baseDir, 'practice.layx'),
      region: '내포',
      status: 'active',
      description: 'Linked to local VISSIM scenario workspace',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function listScenarioCatalog(options = {}) {
  return runVissimReader('list', options);
}

async function aggregateScenarioMetrics(scenarioId, options = {}) {
  return runVissimReader('aggregate', { ...options, scenarioId });
}

async function syncVissimScenarioCatalog({ baseDir = DEFAULT_VISSIM_BASE_DIR } = {}) {
  const catalog = await listScenarioCatalog({ baseDir });
  const model = await ensureVissimModel(baseDir);

  for (const item of catalog.scenarios || []) {
    await Scenario.findOneAndUpdate(
      { scenario_id: item.scenario_id },
      {
        scenario_name: item.scenario_name,
        scenario_type: normalizeScenarioType(item.scenario_type, item.scenario_id, item.scenario_name),
        model_id: model.model_id,
        time_period: 'AM',
        description: `Synced from ${baseDir}\\Scenarios`,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return {
    model_id: model.model_id,
    scenario_count: catalog.scenarios?.length || 0,
    scenario_ids: (catalog.scenarios || []).map((item) => item.scenario_id),
  };
}

async function syncComparisonSnapshots({ baseDir = DEFAULT_VISSIM_BASE_DIR } = {}) {
  const catalog = await listScenarioCatalog({ baseDir });
  const scenarioIds = (catalog.scenarios || []).map((item) => item.scenario_id);
  if (!scenarioIds.includes('S000001')) {
    return { synced: false, reason: 'Base scenario S000001 was not found.' };
  }

  const optionScenarioId = pickOptionScenarioId(catalog.scenarios || []);
  if (!optionScenarioId) {
    return { synced: false, reason: 'No option scenario was found.' };
  }

  const [baseMetrics, optionMetrics] = await Promise.all([
    aggregateScenarioMetrics('S000001', { baseDir }),
    aggregateScenarioMetrics(optionScenarioId, { baseDir }),
  ]);

  const baseByIntersection = new Map(
    (baseMetrics.intersections || []).map((item) => [toNumber(item.intersection_id), item])
  );
  const optionByIntersection = new Map(
    (optionMetrics.intersections || []).map((item) => [toNumber(item.intersection_id), item])
  );

  const intersectionIds = [...new Set([...baseByIntersection.keys(), ...optionByIntersection.keys()])]
    .filter((intersectionId) => Number.isFinite(intersectionId))
    .sort((a, b) => a - b);

  const docs = [];
  intersectionIds.forEach((intersectionId) => {
    const baseIntersection = baseByIntersection.get(intersectionId) || {};
    const optionIntersection = optionByIntersection.get(intersectionId) || {};

    docs.push({
      intersection_id: intersectionId,
      scenario_name: 'Base',
      total_volume: toNumber(baseIntersection.total_volume, toNumber(baseMetrics.network?.total_volume, 0)),
      unserved_vehicles: 0,
      avg_speed: toNumber(baseMetrics.network?.avg_speed, 0),
      avg_delay: toNumber(baseIntersection.avg_delay, toNumber(baseMetrics.network?.avg_delay, 0)),
      avg_travel_time: toNumber(baseMetrics.network?.avg_travel_time, 0),
      total_distance: toNumber(baseMetrics.network?.total_distance, 0),
    });

    docs.push({
      intersection_id: intersectionId,
      scenario_name: 'Option',
      total_volume: toNumber(optionIntersection.total_volume, toNumber(optionMetrics.network?.total_volume, 0)),
      unserved_vehicles: 0,
      avg_speed: toNumber(optionMetrics.network?.avg_speed, 0),
      avg_delay: toNumber(optionIntersection.avg_delay, toNumber(optionMetrics.network?.avg_delay, 0)),
      avg_travel_time: toNumber(optionMetrics.network?.avg_travel_time, 0),
      total_distance: toNumber(optionMetrics.network?.total_distance, 0),
    });
  });

  await SimulationComparison.deleteMany({ scenario_name: { $in: ['Base', 'Option'] } });
  if (docs.length > 0) {
    await SimulationComparison.insertMany(docs);
  }

  return {
    synced: true,
    base_scenario_id: 'S000001',
    option_scenario_id: optionScenarioId,
    intersection_count: intersectionIds.length,
  };
}

async function processScenarioJob(jobOrId, { baseDir = DEFAULT_VISSIM_BASE_DIR } = {}) {
  const job =
    typeof jobOrId === 'string'
      ? await SimulationJob.findOne({ job_id: jobOrId })
      : jobOrId;

  if (!job) {
    throw new Error('Simulation job not found.');
  }

  await SimulationJob.updateOne(
    { job_id: job.job_id },
    {
      $set: {
        status: 'running',
        progress: 10,
        started_at: new Date(),
        log_message: `Applying scenario ${job.scenario_id} from local VISSIM workspace`,
        error_message: undefined,
      },
    }
  );

  try {
    const metrics = await aggregateScenarioMetrics(job.scenario_id, { baseDir });
    const intersections = metrics.intersections || [];

    const intersectionIds = intersections
      .map((item) => toNumber(item.intersection_id, NaN))
      .filter((value) => Number.isFinite(value));

    const intersectionNameMap = new Map();
    if (intersectionIds.length > 0) {
      const docs = await Intersection.find({ intersection_id: { $in: intersectionIds } }).select(
        'intersection_id intersection_name'
      );
      docs.forEach((doc) => {
        intersectionNameMap.set(doc.intersection_id, doc.intersection_name || `Intersection ${doc.intersection_id}`);
      });
    }

    const network = metrics.network || {};
    const simulationResults = intersections.map((item) => {
      const intersectionId = toNumber(item.intersection_id, null);
      return {
        job_id: job.job_id,
        model_id: job.model_id,
        scenario_id: job.scenario_id,
        intersection_id: intersectionId,
        total_volume: toNumber(item.total_volume, toNumber(network.total_volume, 0)),
        avg_speed: toNumber(network.avg_speed, 0),
        avg_delay: toNumber(item.avg_delay, toNumber(network.avg_delay, 0)),
        avg_travel_time: toNumber(network.avg_travel_time, 0),
        total_distance: toNumber(network.total_distance, 0),
        max_queue_length: 0,
        network_score: Math.max(0, Number((100 - toNumber(item.avg_delay, 0)).toFixed(1))),
      };
    });

    const intersectionKpis = intersections.map((item) => {
      const intersectionId = toNumber(item.intersection_id, null);
      const avgDelay = toNumber(item.avg_delay, toNumber(network.avg_delay, 0));
      return {
        job_id: job.job_id,
        intersection_id: intersectionId,
        intersection_name: intersectionNameMap.get(intersectionId) || `Intersection ${intersectionId}`,
        avg_delay: avgDelay,
        avg_speed: toNumber(network.avg_speed, 0),
        queue_length: 0,
        max_queue_length: 0,
        throughput: toNumber(item.total_volume, 0),
        vc_ratio: 0,
        los: computeLos(avgDelay),
        signal_cycle: 0,
      };
    });

    await Promise.all([
      SimulationResult.deleteMany({ job_id: job.job_id }),
      IntersectionKpi.deleteMany({ job_id: job.job_id }),
    ]);

    if (simulationResults.length > 0) {
      await SimulationResult.insertMany(simulationResults);
    }
    if (intersectionKpis.length > 0) {
      await IntersectionKpi.insertMany(intersectionKpis);
    }

    await SimulationJob.updateOne(
      { job_id: job.job_id },
      {
        $set: {
          status: 'done',
          progress: 100,
          finished_at: new Date(),
          log_message: `Scenario ${job.scenario_id} applied (${metrics.run_count || 0} runs aggregated)`,
          error_message: undefined,
        },
      }
    );

    return {
      job_id: job.job_id,
      run_count: metrics.run_count || 0,
      intersection_count: intersections.length,
    };
  } catch (error) {
    await SimulationJob.updateOne(
      { job_id: job.job_id },
      {
        $set: {
          status: 'failed',
          progress: 100,
          finished_at: new Date(),
          error_message: error.message,
          log_message: 'Failed to apply VISSIM scenario',
        },
      }
    );
    throw error;
  }
}

module.exports = {
  DEFAULT_VISSIM_BASE_DIR,
  listScenarioCatalog,
  aggregateScenarioMetrics,
  syncVissimScenarioCatalog,
  syncComparisonSnapshots,
  processScenarioJob,
};
