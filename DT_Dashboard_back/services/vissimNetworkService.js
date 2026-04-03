const fs = require('fs');
const path = require('path');

const DEFAULT_INPX_PATH =
  process.env.VISSIM_INPX_PATH ||
  'C:\\Users\\kaistys\\Desktop\\6_vissim\\Naepo+all_v3_ped_sc_mgnt_opt.inpx';

function decodeBase64Utf8(value = '') {
  return Buffer.from(value, 'base64').toString('utf8');
}

function parseStageProgramIds(intSupplyDataXml) {
  return [...intSupplyDataXml.matchAll(/<stageProg\b[^>]*id="([^"]+)"/g)].map((match) =>
    Number(match[1])
  );
}

function parseSignalProgramIds(intSupplyDataXml) {
  return [...intSupplyDataXml.matchAll(/<prog\b[^>]*id="([^"]+)"/g)].map((match) =>
    Number(match[1])
  );
}

function parseDailyProgramTargets(intSupplyDataXml) {
  return [...intSupplyDataXml.matchAll(/<dailyProg\b[^>]*prog="([^"]+)"/g)].map((match) =>
    Number(match[1])
  );
}

function normalizeName(value = '') {
  return String(value).replace(/\s+/g, '').trim();
}

function parseVissimNetwork(inpxPath = DEFAULT_INPX_PATH) {
  const resolvedPath = path.resolve(inpxPath);
  const xml = fs.readFileSync(resolvedPath, 'utf8');
  const fileStats = fs.statSync(resolvedPath);

  const zOffsetLinks = new Set();
  const zeroGradientLinks = new Set();

  for (const match of xml.matchAll(/<link\b([^>]*)>([\s\S]*?)<\/link>/g)) {
    const attrs = match[1];
    const body = match[2];
    const linkNo = Number(attrs.match(/\bno="([^"]+)"/)?.[1] || 0);
    const gradient = Number(attrs.match(/\bgradient="([^"]+)"/)?.[1] || 0);

    if (!linkNo) {
      continue;
    }

    if (gradient === 0) {
      zeroGradientLinks.add(linkNo);
    }

    if (/<linkPolyPoint\b[^>]*zOffset="(?!0(?:\.0+)?")([^"]+)"/.test(body)) {
      zOffsetLinks.add(linkNo);
    }
  }

  const controllers = [...xml.matchAll(/<signalController\b([^>]*)>/g)].map((match) => {
    const attrs = match[1];
    const id = Number(attrs.match(/\bno="([^"]+)"/)?.[1] || 0);
    const name = attrs.match(/\bname="([^"]*)"/)?.[1] || '';
    const progNo = Number(attrs.match(/\bprogNo="([^"]+)"/)?.[1] || 0);
    const type = attrs.match(/\btype="([^"]+)"/)?.[1] || '';
    const intSupplyData = attrs.match(/\bintSupplyData="([^"]*)"/)?.[1] || '';
    const intSupplyDataXml = intSupplyData ? decodeBase64Utf8(intSupplyData) : '';
    const signalProgramIds = parseSignalProgramIds(intSupplyDataXml);
    const stageProgramIds = parseStageProgramIds(intSupplyDataXml);
    const dailyProgramTargets = parseDailyProgramTargets(intSupplyDataXml);
    const availableProgramIds = new Set([
      ...signalProgramIds,
      ...dailyProgramTargets,
      ...stageProgramIds,
    ]);
    const hasConfiguredProgram = progNo > 0 && availableProgramIds.has(progNo);
    const programSource =
      signalProgramIds.includes(progNo)
        ? 'signalProgram'
        : dailyProgramTargets.includes(progNo)
          ? 'dailyProgramList'
          : stageProgramIds.includes(progNo)
            ? 'stageProgramOnly'
            : 'missing';

    return {
      controller_id: id,
      controller_name: name,
      normalized_name: normalizeName(name),
      type,
      program_number: progNo,
      signal_program_ids: signalProgramIds,
      stage_program_ids: stageProgramIds,
      daily_program_targets: dailyProgramTargets,
      has_configured_program: hasConfiguredProgram,
      program_source: programSource,
      status: hasConfiguredProgram ? 'ok' : 'warning',
    };
  });

  const warnings = [];
  const invalidControllers = controllers.filter((controller) => !controller.has_configured_program);

  if (zOffsetLinks.size > 0) {
    const affectedLinks = [...zOffsetLinks].filter((linkNo) => zeroGradientLinks.has(linkNo));
    if (affectedLinks.length > 0) {
      warnings.push({
        type: 'gradient',
        severity: 'warning',
        message:
          'Some links have Z-offset geometry while vehicle gradient is still zero, so vehicle behavior ignores elevation.',
        affected_link_count: affectedLinks.length,
      });
    }
  }

  invalidControllers.forEach((controller) => {
    warnings.push({
      type: 'signal-program',
      severity: 'error',
      controller_id: controller.controller_id,
      controller_name: controller.controller_name,
      message: `Program number ${controller.program_number} is not backed by a signal program or daily program list.`,
    });
  });

  return {
    file: {
      path: resolvedPath,
      name: path.basename(resolvedPath),
      updated_at: fileStats.mtime.toISOString(),
    },
    summary: {
      signal_controller_count: controllers.length,
      healthy_controller_count: controllers.length - invalidControllers.length,
      invalid_controller_count: invalidControllers.length,
      z_offset_link_count: zOffsetLinks.size,
      gradient_warning_link_count: [...zOffsetLinks].filter((linkNo) => zeroGradientLinks.has(linkNo))
        .length,
    },
    warnings,
    controllers,
  };
}

module.exports = {
  DEFAULT_INPX_PATH,
  parseVissimNetwork,
  normalizeName,
};
