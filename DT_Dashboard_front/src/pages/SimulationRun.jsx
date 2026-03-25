import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Server, Boxes, ListChecks } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import StatusBadge from "@/components/simulation/StatusBadge";
import { getIntersections } from "@/services/api";
import {
  createSimulationJob,
  getRunnerStatus,
  getScenarios,
  getSimulationJobs,
  getSimulationModels,
} from "@/services/simulationApi";

export default function SimulationRun() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [modelId, setModelId] = React.useState("");
  const [scenarioId, setScenarioId] = React.useState("");
  const [timePeriod, setTimePeriod] = React.useState("AM");
  const [selectedIntersectionIds, setSelectedIntersectionIds] = React.useState([]);
  const [createdJob, setCreatedJob] = React.useState(null);

  const { data: models = [] } = useQuery({
    queryKey: ["simulation-models"],
    queryFn: getSimulationModels,
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["simulation-scenarios", modelId],
    queryFn: () => getScenarios(modelId ? { model_id: modelId } : {}),
  });

  const { data: intersections = [] } = useQuery({
    queryKey: ["intersections"],
    queryFn: getIntersections,
  });

  const { data: runnerStatus } = useQuery({
    queryKey: ["runner-status"],
    queryFn: getRunnerStatus,
    refetchInterval: 10000,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["simulation-jobs"],
    queryFn: () => getSimulationJobs({ limit: 5 }),
  });

  React.useEffect(() => {
    if (!modelId && models.length > 0) {
      setModelId(models[0].model_id);
    }
  }, [modelId, models]);

  React.useEffect(() => {
    if (!scenarioId && scenarios.length > 0) {
      setScenarioId(scenarios[0].scenario_id);
    }
  }, [scenarioId, scenarios]);

  const createJobMutation = useMutation({
    mutationFn: createSimulationJob,
    onSuccess: (data) => {
      setCreatedJob(data);
      queryClient.invalidateQueries({ queryKey: ["simulation-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["runner-status"] });
    },
  });

  const toggleIntersection = (intersectionId) => {
    setSelectedIntersectionIds((prev) => (
      prev.includes(intersectionId)
        ? prev.filter((id) => id !== intersectionId)
        : [...prev, intersectionId]
    ));
  };

  const handleSubmit = () => {
    if (!modelId || !scenarioId) return;

    createJobMutation.mutate({
      model_id: modelId,
      scenario_id: scenarioId,
      intersection_ids: selectedIntersectionIds,
      time_period: timePeriod,
      requested_by: "dashboard",
    });
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto p-4 lg:p-6 flex flex-col h-[calc(100vh-20px)] overflow-hidden">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
          {t("simulationRunTitle")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-dashdark-muted mt-1">
          {t("simulationRunDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 min-h-0">
        <div className="xl:col-span-7 flex flex-col gap-5 min-h-0">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <Boxes className="w-4 h-4 text-violet-500" />
                {t("simulationConfig")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-500 dark:text-dashdark-muted">{t("selectModel")}</p>
                  <Select value={modelId} onValueChange={setModelId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectModel")} />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.model_id} value={model.model_id}>
                          {model.model_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-500 dark:text-dashdark-muted">{t("selectScenario")}</p>
                  <Select value={scenarioId} onValueChange={setScenarioId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectScenario")} />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.scenario_id} value={scenario.scenario_id}>
                          {scenario.scenario_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-500 dark:text-dashdark-muted">{t("timePeriodLabel")}</p>
                  <Select value={timePeriod} onValueChange={setTimePeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("timePeriodLabel")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                      <SelectItem value="OFFPEAK">OFFPEAK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-dashdark-muted">{t("selectIntersections")}</p>
                  <span className="text-xs text-slate-400 dark:text-dashdark-muted">
                    {t("selectedCount")}: {selectedIntersectionIds.length}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-dashdark-border p-3">
                  <div className="grid md:grid-cols-2 gap-2">
                    {intersections.map((intersection) => {
                      const isSelected = selectedIntersectionIds.includes(intersection.intersection_id);
                      return (
                        <button
                          key={intersection.intersection_id}
                          type="button"
                          onClick={() => toggleIntersection(intersection.intersection_id)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? "border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-400 dark:bg-violet-900/20 dark:text-violet-300"
                              : "border-slate-200 bg-white text-slate-700 dark:border-dashdark-border dark:bg-dashdark-bg dark:text-dashdark-text"
                          }`}
                        >
                          <div className="font-semibold">{intersection.intersection_name}</div>
                          <div className="text-xs opacity-70">ID {intersection.intersection_id}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={createJobMutation.isPending || !modelId || !scenarioId}
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  {createJobMutation.isPending ? t("submitting") : t("submitSimulation")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-5 flex flex-col gap-5 min-h-0">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <Server className="w-4 h-4 text-blue-500" />
                {t("runnerStatus")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-dashdark-muted">{t("statusLabel")}</span>
                <StatusBadge status={runnerStatus?.runner_status} />
              </div>
              <div className="text-sm text-slate-600 dark:text-dashdark-text">
                {t("activeJob")}: {runnerStatus?.active_job_id || "-"}
              </div>
              {createdJob && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  {t("createdJob")}: {createdJob.job_id}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border flex-1 min-h-0">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <ListChecks className="w-4 h-4 text-emerald-500" />
                {t("recentJobs")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto">
              {jobs.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-dashdark-muted">{t("noJobs")}</p>
              )}
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="rounded-lg border border-slate-200 dark:border-dashdark-border px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-800 dark:text-white">{job.job_id}</div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-2 text-sm text-slate-500 dark:text-dashdark-muted">
                    {job.model_id} / {job.scenario_id}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 dark:text-dashdark-muted">
                    progress: {job.progress ?? 0}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
