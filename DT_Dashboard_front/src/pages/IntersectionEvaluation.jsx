import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Timer, TrafficCone, ChartColumnBig } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { getIntersections } from "@/services/api";
import { getIntersectionResult, getIntersectionResults } from "@/services/resultApi";

function MetricCard({ title, value, unit, icon: Icon }) {
  return (
    <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-dashdark-muted">{title}</p>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {value}
              <span className="ml-1 text-sm font-medium text-slate-400">{unit}</span>
            </div>
          </div>
          <div className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntersectionEvaluation() {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = React.useState("");

  const { data: intersections = [] } = useQuery({
    queryKey: ["intersections"],
    queryFn: getIntersections,
  });

  const { data: intersectionResults = [] } = useQuery({
    queryKey: ["intersection-results"],
    queryFn: () => getIntersectionResults(),
  });

  React.useEffect(() => {
    if (!selectedId && intersections.length > 0) {
      setSelectedId(String(intersections[0].intersection_id));
    }
  }, [selectedId, intersections]);

  const { data: detail } = useQuery({
    queryKey: ["intersection-detail", selectedId],
    queryFn: () => getIntersectionResult(selectedId),
    enabled: Boolean(selectedId),
  });

  const topRows = intersectionResults.slice(0, 10);

  return (
    <div className="w-full max-w-[1920px] mx-auto p-4 lg:p-6 flex flex-col h-[calc(100vh-20px)] overflow-hidden">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
          {t("evaluationTitle")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-dashdark-muted mt-1">
          {t("evaluationDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 min-h-0">
        <div className="xl:col-span-4 flex flex-col gap-5">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white text-base">
                {t("selectIntersection")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectIntersection")} />
                </SelectTrigger>
                <SelectContent>
                  {intersections.map((intersection) => (
                    <SelectItem
                      key={intersection.intersection_id}
                      value={String(intersection.intersection_id)}
                    >
                      {intersection.intersection_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border flex-1 min-h-0">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white text-base">
                {t("topIntersections")}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-2">
                {topRows.map((row) => (
                  <button
                    key={row.intersection_id}
                    type="button"
                    onClick={() => setSelectedId(String(row.intersection_id))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left dark:border-dashdark-border"
                  >
                    <div className="font-semibold text-slate-800 dark:text-white">
                      {row.intersection_name || `Intersection ${row.intersection_id}`}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-dashdark-muted">
                      throughput {row.throughput ?? 0} / speed {row.avg_speed ?? 0}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-8 flex flex-col gap-5">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard title={t("los")} value={detail?.los || "N/A"} unit="" icon={Gauge} />
            <MetricCard title={t("delay")} value={detail?.avg_delay ?? 0} unit="s" icon={Timer} />
            <MetricCard title={t("queue")} value={detail?.queue_length ?? 0} unit="veh" icon={TrafficCone} />
            <MetricCard title={t("volume")} value={detail?.throughput ?? 0} unit="veh" icon={ChartColumnBig} />
          </div>

          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border flex-1">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white text-base">
                {detail?.intersection_name || t("evaluationSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-dashdark-bg">
                <div className="text-slate-500 dark:text-dashdark-muted">Avg Speed</div>
                <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  {detail?.avg_speed ?? 0} km/h
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-dashdark-bg">
                <div className="text-slate-500 dark:text-dashdark-muted">V/C Ratio</div>
                <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  {detail?.vc_ratio ?? 0}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-dashdark-bg">
                <div className="text-slate-500 dark:text-dashdark-muted">Max Queue</div>
                <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  {detail?.max_queue_length ?? 0}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-dashdark-bg">
                <div className="text-slate-500 dark:text-dashdark-muted">Signal Cycle</div>
                <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  {detail?.signal_cycle ?? 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
