import React, { useState } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { History, Clock, CheckCircle, XCircle, Loader, Info } from "lucide-react";
import { format } from 'date-fns';

const API_URL = 'http://localhost:3001/api';

const STATUS_CONFIG = {
  queued:  { icon: Clock,        color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20',  label: 'Queued'  },
  running: { icon: Loader,       color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',      label: 'Running' },
  done:    { icon: CheckCircle,  color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20',    label: 'Done'    },
  failed:  { icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',        label: 'Failed'  },
};

export default function SimulationHistory() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['simulations', statusFilter],
    queryFn: () => axios.get(`${API_URL}/simulations`, {
      params: { status: statusFilter === 'all' ? undefined : statusFilter, limit: 50 }
    }).then(res => res.data),
    refetchInterval: 5000,
  });

  const { data: jobDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['simulationDetail', selectedJobId],
    queryFn: () => axios.get(`${API_URL}/simulations/${selectedJobId}`).then(res => res.data),
    enabled: !!selectedJobId,
  });

  const statuses = ['all', 'queued', 'running', 'done', 'failed'];

  return (
    <motion.div
      className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('simHistoryTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-dashdark-muted mt-1">{t('simHistoryDesc')}</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
              statusFilter === s
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-dashdark-card text-slate-500 dark:text-dashdark-muted hover:bg-slate-200 dark:hover:bg-dashdark-hover'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Job List */}
        <div className="lg:col-span-3 space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : jobs.length === 0 ? (
            <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
              <CardContent className="p-12 flex flex-col items-center gap-2 text-slate-400">
                <History className="w-10 h-10" />
                <p className="text-sm">{t('noJobs')}</p>
              </CardContent>
            </Card>
          ) : jobs.map(job => {
            const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
            const Icon = cfg.icon;
            const isSelected = selectedJobId === job.job_id;
            return (
              <motion.div
                key={job.job_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedJobId(isSelected ? null : job.job_id)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 shadow-md'
                    : 'border-slate-200 dark:border-dashdark-border bg-white dark:bg-dashdark-card hover:border-violet-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${cfg.color} ${job.status === 'running' ? 'animate-spin' : ''}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-400 truncate">{job.job_id}</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-dashdark-text mt-0.5 truncate">
                        {job.model_id} / {job.scenario_id}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {job.status === 'running' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Progress</span><span>{job.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${job.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {job.createdAt && (
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    {format(new Date(job.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Job Detail */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border sticky top-4">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border">
              <CardTitle className="text-sm font-bold text-slate-700 dark:text-dashdark-text flex items-center gap-2">
                <Info className="w-4 h-4 text-violet-500" />
                {t('jobDetail')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!selectedJobId ? (
                <p className="text-xs text-slate-400 text-center py-8">{t('selectJobPrompt')}</p>
              ) : detailLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : jobDetail ? (
                <div className="space-y-3 text-xs">
                  {[
                    ['Job ID',       jobDetail.job_id],
                    ['Model',        jobDetail.model_id],
                    ['Scenario',     jobDetail.scenario_id],
                    ['Status',       jobDetail.status?.toUpperCase()],
                    ['Progress',     `${jobDetail.progress ?? 0}%`],
                    ['Requested By', jobDetail.requested_by],
                    ['Started',      jobDetail.started_at
                      ? format(new Date(jobDetail.started_at), 'yyyy-MM-dd HH:mm')
                      : '-'],
                    ['Finished',     jobDetail.finished_at
                      ? format(new Date(jobDetail.finished_at), 'yyyy-MM-dd HH:mm')
                      : '-'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2 border-b border-slate-50 dark:border-dashdark-border pb-2 last:border-0 last:pb-0">
                      <span className="text-slate-400 font-medium shrink-0">{label}</span>
                      <span className="text-slate-700 dark:text-dashdark-text font-mono text-right break-all">{value || '-'}</span>
                    </div>
                  ))}
                  {jobDetail.error_message && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-600 text-[10px]">
                      {jobDetail.error_message}
                    </div>
                  )}
                  {jobDetail.log_message && (
                    <div className="mt-2 p-2 bg-slate-50 dark:bg-dashdark-bg rounded text-slate-500 text-[10px]">
                      {jobDetail.log_message}
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
