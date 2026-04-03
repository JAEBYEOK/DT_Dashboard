import React, { useState } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { Activity, Gauge, Timer, AlertTriangle, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

const API_URL = 'http://localhost:3001/api';

const LOS_COLORS = {
  A: '#22c55e', B: '#84cc16', C: '#eab308',
  D: '#f97316', E: '#ef4444', F: '#7f1d1d'
};

export default function IntersectionEvaluation() {
  const { t } = useLanguage();
  const [selectedJobId, setSelectedJobId] = useState('');

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['simulationsDone'],
    queryFn: () => axios.get(`${API_URL}/simulations`, {
      params: { status: 'done', limit: 50 }
    }).then(res => res.data),
  });

  const { data: kpiList = [], isLoading: kpiLoading } = useQuery({
    queryKey: ['intersectionKpi', selectedJobId],
    queryFn: () => axios.get(`${API_URL}/results/intersections`, {
      params: selectedJobId ? { job_id: selectedJobId } : {}
    }).then(res => res.data),
  });

  const isLoading = jobsLoading || kpiLoading;

  const avgDelay = kpiList.length
    ? kpiList.reduce((s, k) => s + (k.avg_delay || 0), 0) / kpiList.length
    : 0;
  const avgSpeed = kpiList.length
    ? kpiList.reduce((s, k) => s + (k.avg_speed || 0), 0) / kpiList.length
    : 0;
  const worstLos = kpiList.reduce((w, k) => (k.los || 'A') > w ? (k.los || 'A') : w, 'A');

  const chartData = kpiList.map(k => ({
    name: k.intersection_name || `ID ${k.intersection_id}`,
    delay: parseFloat((k.avg_delay || 0).toFixed(1)),
    los: k.los || 'A',
  }));

  return (
    <motion.div
      className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('evalTitle')}</h1>
          <p className="text-sm text-slate-500 dark:text-dashdark-muted mt-1">{t('evalDesc')}</p>
        </div>
        <div className="w-full sm:w-64">
          <label className="text-xs font-semibold text-slate-500 dark:text-dashdark-muted uppercase tracking-wide block mb-1.5">
            {t('selectJob')}
          </label>
          {jobsLoading ? <Skeleton className="h-10 w-full" /> : (
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="bg-white dark:bg-dashdark-bg">
                <SelectValue placeholder={t('allJobs')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allJobs')}</SelectItem>
                {jobs.map(j => (
                  <SelectItem key={j.job_id} value={j.job_id}>{j.job_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : kpiList.length === 0 ? (
        <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
          <CardContent className="p-12 flex flex-col items-center gap-3 text-slate-400">
            <BarChart3 className="w-12 h-12" />
            <p className="text-sm font-medium">{t('noKpiData')}</p>
            <p className="text-xs text-center text-slate-300 dark:text-slate-600">{t('noKpiDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('evalIntersections'), value: kpiList.length,           icon: Activity,      color: 'text-violet-500' },
              { label: t('evalAvgDelay'),      value: `${avgDelay.toFixed(1)}s`, icon: Timer,         color: 'text-orange-500' },
              { label: t('evalAvgSpeed'),      value: `${avgSpeed.toFixed(1)} km/h`, icon: Gauge,    color: 'text-blue-500'   },
              { label: t('evalWorstLos'),      value: worstLos,                  icon: AlertTriangle, color: 'text-red-500'    },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${color}`} />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-dashdark-muted">{label}</p>
                    <p className="text-xl font-black text-slate-800 dark:text-dashdark-text">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Delay Chart */}
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border">
              <CardTitle className="text-sm font-bold text-slate-700 dark:text-dashdark-text flex items-center gap-2">
                <Timer className="w-4 h-4 text-violet-500" />
                {t('evalDelayChart')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-35}
                      textAnchor="end"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="s" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', fontSize: 12 }}
                      formatter={v => [`${v}s`, t('evalAvgDelay')]}
                    />
                    <Bar dataKey="delay" radius={[4, 4, 0, 0]} barSize={30}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={LOS_COLORS[entry.los] || '#8b5cf6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* LOS Legend */}
              <div className="flex gap-3 mt-2 flex-wrap justify-center">
                {Object.entries(LOS_COLORS).map(([los, color]) => (
                  <div key={los} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-[10px] font-bold text-slate-500">LOS {los}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* KPI Table */}
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border">
              <CardTitle className="text-sm font-bold text-slate-700 dark:text-dashdark-text flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-500" />
                {t('evalKpiTable')}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-dashdark-border bg-slate-50 dark:bg-dashdark-bg">
                    {['#', t('intersection'), t('evalAvgDelay'), t('evalAvgSpeed'), 'Queue', 'LOS'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-500 dark:text-dashdark-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kpiList.map((k, i) => (
                    <tr
                      key={k.intersection_id}
                      className={`border-b border-slate-50 dark:border-dashdark-border ${
                        i % 2 !== 0 ? 'bg-slate-50/50 dark:bg-dashdark-bg/30' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-dashdark-text whitespace-nowrap">
                        {k.intersection_name || `ID ${k.intersection_id}`}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-dashdark-muted">
                        {(k.avg_delay || 0).toFixed(1)}s
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-dashdark-muted">
                        {(k.avg_speed || 0).toFixed(1)} km/h
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-dashdark-muted">
                        {(k.queue_length || 0).toFixed(0)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="font-black px-2 py-0.5 rounded text-white text-[11px]"
                          style={{ backgroundColor: LOS_COLORS[k.los] || '#8b5cf6' }}
                        >
                          {k.los || 'A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </motion.div>
  );
}
