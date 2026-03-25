function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateDeltaPercent(baseValue, optionValue) {
  const base = toNumber(baseValue);
  const option = toNumber(optionValue);

  if (base === 0) return 0;
  return Number((((option - base) / base) * 100).toFixed(1));
}

function buildComparisonResponse(baseDoc = {}, optionDoc = {}) {
  const base = {
    total_volume: toNumber(baseDoc.total_volume),
    avg_speed: toNumber(baseDoc.avg_speed),
    avg_delay: toNumber(baseDoc.avg_delay),
    avg_travel_time: toNumber(baseDoc.avg_travel_time),
    total_distance: toNumber(baseDoc.total_distance),
  };

  const option = {
    total_volume: toNumber(optionDoc.total_volume),
    avg_speed: toNumber(optionDoc.avg_speed),
    avg_delay: toNumber(optionDoc.avg_delay),
    avg_travel_time: toNumber(optionDoc.avg_travel_time),
    total_distance: toNumber(optionDoc.total_distance),
  };

  return {
    intersection_id: baseDoc.intersection_id ?? optionDoc.intersection_id ?? null,
    base,
    option,
    delta: {
      total_volume_pct: calculateDeltaPercent(base.total_volume, option.total_volume),
      avg_speed_pct: calculateDeltaPercent(base.avg_speed, option.avg_speed),
      avg_delay_pct: calculateDeltaPercent(base.avg_delay, option.avg_delay),
      avg_travel_time_pct: calculateDeltaPercent(base.avg_travel_time, option.avg_travel_time),
      total_distance_pct: calculateDeltaPercent(base.total_distance, option.total_distance),
    },
  };
}

module.exports = {
  buildComparisonResponse,
  calculateDeltaPercent,
};
