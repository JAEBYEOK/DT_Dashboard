import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileWarning, Layers3, Signal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = import.meta.env.VITE_API_URL;

function SummaryMetric({ icon: Icon, label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-700",
    green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.slate}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

export default function VissimNetworkStatus({ selectedIntersection }) {
  const networkQuery = useQuery({
    queryKey: ["vissim-network-status"],
    queryFn: () => axios.get(`${API_URL}/system/vissim-network`).then((res) => res.data),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const matchedControllerQuery = useQuery({
    queryKey: ["vissim-network-match", selectedIntersection?.intersection_name],
    enabled: Boolean(selectedIntersection?.intersection_name),
    queryFn: () =>
      axios
        .get(`${API_URL}/system/vissim-network/intersection`, {
          params: { name: selectedIntersection.intersection_name },
        })
        .then((res) => res.data),
    staleTime: 60 * 1000,
  });

  if (networkQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl xl:col-span-2" />
      </div>
    );
  }

  if (networkQuery.isError) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
            <FileWarning className="h-4 w-4" />
            Vissim 네트워크 현황을 불러오지 못했습니다
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-700/90 dark:text-red-300/90">
          {networkQuery.error?.response?.data?.message || networkQuery.error?.message}
        </CardContent>
      </Card>
    );
  }

  const data = networkQuery.data;
  const match = matchedControllerQuery.data?.match || null;
  const summary = data.summary;
  const invalidControllers = data.controllers.filter((controller) => controller.status === "warning");

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm xl:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Signal className="h-4 w-4 text-cyan-600" />
            Vissim 네트워크 현황
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-dashdark-muted">
            {data.file.name}
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <SummaryMetric
            icon={Layers3}
            label="신호제어기"
            value={summary.signal_controller_count}
            tone="slate"
          />
          <SummaryMetric
            icon={CheckCircle2}
            label="정상"
            value={summary.healthy_controller_count}
            tone="green"
          />
          <SummaryMetric
            icon={AlertTriangle}
            label="프로그램 오류"
            value={summary.invalid_controller_count}
            tone={summary.invalid_controller_count > 0 ? "red" : "green"}
          />
          <SummaryMetric
            icon={FileWarning}
            label="경사 경고 링크"
            value={summary.gradient_warning_link_count}
            tone={summary.gradient_warning_link_count > 0 ? "amber" : "green"}
          />
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm xl:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
            {selectedIntersection ? "선택 교차로 연동 상태" : "현재 주요 경고"}
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-dashdark-muted">
            {selectedIntersection
              ? `${selectedIntersection.intersection_name}와 연결되는 Vissim 신호제어기 상태`
              : "Vissim 네트워크에서 즉시 확인이 필요한 항목"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedIntersection && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              {matchedControllerQuery.isLoading ? (
                <Skeleton className="h-20 rounded-lg" />
              ) : match ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">매칭 제어기</div>
                    <div className="mt-1 font-bold text-slate-900 dark:text-white">
                      {match.controller_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Program No</div>
                    <div className="mt-1 font-bold text-slate-900 dark:text-white">
                      {match.program_number}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Stage Programs</div>
                    <div className="mt-1 font-bold text-slate-900 dark:text-white">
                      {match.stage_program_ids.join(", ") || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">상태</div>
                    <div
                      className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                        match.status === "ok"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {match.status === "ok" ? "정상" : "확인 필요"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  선택한 교차로 이름과 일치하는 Vissim 신호제어기를 찾지 못했습니다.
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {invalidControllers.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                현재 파일 기준으로는 신호 프로그램 번호 불일치가 없습니다.
              </div>
            ) : (
              invalidControllers.slice(0, 5).map((controller) => (
                <div
                  key={controller.controller_id}
                  className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20"
                >
                  <div>
                    <div className="font-semibold text-red-700 dark:text-red-300">
                      {controller.controller_id}: {controller.controller_name}
                    </div>
                    <div className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">
                      Program No {controller.program_number} / Stage IDs{" "}
                      {controller.stage_program_ids.join(", ") || "-"}
                    </div>
                  </div>
                  <div className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    확인 필요
                  </div>
                </div>
              ))
            )}

            {summary.gradient_warning_link_count > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                링크 {summary.gradient_warning_link_count}개는 Z-offset이 있지만 차량 경사 계산에는 반영되지 않고 있습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
