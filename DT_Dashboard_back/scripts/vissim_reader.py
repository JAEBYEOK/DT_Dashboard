#!/usr/bin/env python3
"""Read scenario metadata and aggregated KPI values from a local VISSIM workspace."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import statistics
import sys
from pathlib import Path

SCENARIO_ID_PATTERN = re.compile(r"^S\d{6}$")
INTERSECTION_ID_PATTERN = re.compile(r"^\d+$")


def _safe_float(value: object) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _mean(values: list[float | None]) -> float | None:
    numeric = [value for value in values if value is not None]
    if not numeric:
        return None
    return float(statistics.mean(numeric))


def _round(value: float | None, ndigits: int = 3) -> float | None:
    return round(value, ndigits) if value is not None else None


def _list_scenarios(base_dir: Path) -> dict:
    project_db = base_dir / "practice.vissimpdb"
    scenarios: list[dict] = []

    if project_db.exists():
        conn = sqlite3.connect(project_db)
        try:
            cur = conn.cursor()
            cur.execute("SELECT NO, NAME, MODIFICATIONS FROM SCENARIO ORDER BY NO")
            for number, name, modifications in cur.fetchall():
                scenario_id = f"S{int(number):06d}"
                scenario_name = (name or scenario_id).strip()
                scenario_type = "base" if int(number) == 1 or "base" in scenario_name.lower() else "option"
                scenarios.append(
                    {
                        "scenario_id": scenario_id,
                        "scenario_name": scenario_name,
                        "scenario_type": scenario_type,
                        "modifications": modifications or "",
                    }
                )
        finally:
            conn.close()
    else:
        scenarios_dir = base_dir / "Scenarios"
        for item in sorted(scenarios_dir.iterdir()) if scenarios_dir.exists() else []:
            if item.is_dir() and SCENARIO_ID_PATTERN.fullmatch(item.name):
                scenarios.append(
                    {
                        "scenario_id": item.name,
                        "scenario_name": item.name,
                        "scenario_type": "base" if item.name == "S000001" else "option",
                        "modifications": "",
                    }
                )

    return {
        "base_dir": str(base_dir),
        "scenario_count": len(scenarios),
        "scenarios": scenarios,
    }


def _read_single_run(db_path: Path) -> tuple[dict | None, dict[int, dict[str, float]]]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT DELAYAVG, STOPSAVG, SPEEDAVG, DELAYSTOPAVG,
                   DISTTOT, TRAVTMTOT, DELAYTOT, VEHACT, VEHARR
            FROM VEHICLENETWORKPERFORMANCEMEASUREMENT_EvaluationTimeIntervalClass
            WHERE ARG_VEHICLECLASS = 'ALL' LIMIT 1
            """
        )
        network_row = cur.fetchone()
        network = dict(network_row) if network_row else None

        cur.execute(
            """
            SELECT OBJECT_ID, VEHS, VEHDELAY
            FROM MOVEMENT_EvaluationTimeIntervalClass
            WHERE ARG_VEHICLECLASS = 'ALL'
            """
        )
        intersections: dict[int, dict[str, float]] = {}
        for row in cur.fetchall():
            object_id = str(row["OBJECT_ID"] or "").strip()
            if not INTERSECTION_ID_PATTERN.fullmatch(object_id):
                continue
            intersection_id = int(object_id)
            intersections[intersection_id] = {
                "total_volume": _safe_float(row["VEHS"]) or 0.0,
                "avg_delay": _safe_float(row["VEHDELAY"]) or 0.0,
            }

        return network, intersections
    finally:
        conn.close()


def _aggregate_scenario(base_dir: Path, scenario_id: str) -> dict:
    scenario_path = base_dir / "Scenarios" / scenario_id
    results_dir = scenario_path / f"{scenario_id}.results"
    db_paths = [results_dir / f"{run}.db" for run in range(1, 6)]

    network_runs: list[dict] = []
    intersection_runs: dict[int, list[dict[str, float]]] = {}
    used_db_paths: list[str] = []

    for db_path in db_paths:
        if not db_path.exists():
            continue

        network, intersections = _read_single_run(db_path)
        if network:
            network_runs.append(network)

        for intersection_id, metrics in intersections.items():
            intersection_runs.setdefault(intersection_id, []).append(metrics)

        used_db_paths.append(str(db_path))

    if not used_db_paths:
        raise FileNotFoundError(f"No result databases found for scenario '{scenario_id}'.")

    avg_travel_time_runs = []
    for row in network_runs:
        total_travel_time = _safe_float(row.get("TRAVTMTOT"))
        arrived_vehicles = _safe_float(row.get("VEHARR"))
        active_vehicles = _safe_float(row.get("VEHACT"))
        denominator = arrived_vehicles if arrived_vehicles not in (None, 0) else active_vehicles
        if total_travel_time is None or denominator in (None, 0):
            avg_travel_time_runs.append(None)
        else:
            avg_travel_time_runs.append(total_travel_time / denominator)

    network = {
        "total_volume": _round(
            _mean([_safe_float(row.get("VEHARR")) for row in network_runs])
            or _mean([_safe_float(row.get("VEHACT")) for row in network_runs]),
            3,
        ),
        "avg_speed": _round(_mean([_safe_float(row.get("SPEEDAVG")) for row in network_runs]), 3),
        "avg_delay": _round(_mean([_safe_float(row.get("DELAYAVG")) for row in network_runs]), 3),
        "avg_travel_time": _round(_mean(avg_travel_time_runs), 3),
        "total_distance": _round(_mean([_safe_float(row.get("DISTTOT")) for row in network_runs]), 3),
    }

    intersections = []
    for intersection_id in sorted(intersection_runs):
        rows = intersection_runs[intersection_id]
        volumes = [row["total_volume"] for row in rows]
        weighted_delay_numerator = sum(row["total_volume"] * row["avg_delay"] for row in rows)
        weighted_delay_denominator = sum(row["total_volume"] for row in rows)
        weighted_delay = (
            weighted_delay_numerator / weighted_delay_denominator
            if weighted_delay_denominator > 0
            else _mean([row["avg_delay"] for row in rows]) or 0.0
        )

        intersections.append(
            {
                "intersection_id": intersection_id,
                "total_volume": _round(_mean(volumes), 3),
                "avg_delay": _round(weighted_delay, 3),
            }
        )

    return {
        "scenario_id": scenario_id,
        "run_count": len(used_db_paths),
        "db_paths": used_db_paths,
        "network": network,
        "intersections": intersections,
    }


def _parse_args() -> argparse.Namespace:
    default_base_dir = Path.home() / "Desktop" / "VIssim"
    parser = argparse.ArgumentParser(description="VISSIM scenario helper")
    parser.add_argument("command", choices=["list", "aggregate"])
    parser.add_argument(
        "--base-dir",
        default=str(default_base_dir),
        help="VISSIM workspace path (default: ~/Desktop/VIssim)",
    )
    parser.add_argument("--scenario-id", help="Scenario ID for aggregate command (e.g. S000001)")
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    base_dir = Path(args.base_dir).expanduser().resolve()

    try:
        if args.command == "list":
            payload = _list_scenarios(base_dir)
        else:
            if not args.scenario_id:
                raise ValueError("--scenario-id is required for aggregate command.")
            payload = _aggregate_scenario(base_dir, args.scenario_id.strip())

        print(json.dumps(payload, ensure_ascii=False))
        return 0
    except Exception as exc:  # pragma: no cover - CLI error boundary
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
