import React from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Server } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import StatusBadge from "@/components/simulation/StatusBadge";
import { getRunnerStatus, getSimulationJobs } from "@/services/simulationApi";

export default function SimulationHistory() {
  const { t } = useLanguage();

  const { data: jobs = [] } = useQuery({
    queryKey: ["simulation-history"],
    queryFn: () => getSimulationJobs({ limit: 20 }),
  });

  const { data: runnerStatus } = useQuery({
    queryKey: ["runner-status"],
    queryFn: getRunnerStatus,
    refetchInterval: 10000,
  });

  return (
    <div className="w-full max-w-[1920px] mx-auto p-4 lg:p-6 flex flex-col h-[calc(100vh-20px)] overflow-hidden">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
          {t("historyTitle")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-dashdark-muted mt-1">
          {t("historyDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 min-h-0">
        <div className="xl:col-span-3">
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
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-9 min-h-0">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <History className="w-4 h-4 text-violet-500" />
                {t("recentJobs")}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left dark:border-dashdark-border">
                      <th className="pb-3 pr-4">Job ID</th>
                      <th className="pb-3 pr-4">Model</th>
                      <th className="pb-3 pr-4">Scenario</th>
                      <th className="pb-3 pr-4">{t("statusLabel")}</th>
                      <th className="pb-3 pr-4">Progress</th>
                      <th className="pb-3 pr-4">Requested By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.job_id}
                        className="border-b border-slate-100 dark:border-dashdark-border/60"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-800 dark:text-white">
                          {job.job_id}
                        </td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-dashdark-text">{job.model_id}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-dashdark-text">{job.scenario_id}</td>
                        <td className="py-3 pr-4"><StatusBadge status={job.status} /></td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-dashdark-text">{job.progress ?? 0}%</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-dashdark-text">{job.requested_by || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {jobs.length === 0 && (
                  <p className="pt-4 text-sm text-slate-500 dark:text-dashdark-muted">{t("noJobs")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
