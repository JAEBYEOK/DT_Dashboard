import React, { useState } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { Play, Server, Cpu, AlertCircle, CheckCircle } from "lucide-react";

const API_URL = 'http://localhost:3001/api';

export default function SimulationRun() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedJob, setSubmittedJob] = useState(null);
  const [error, setError] = useState(null);

  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['vissimModels'],
    queryFn: () => axios.get(`${API_URL}/vissim/models`).then(res => res.data),
  });

  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery({
    queryKey: ['scenarios', selectedModel],
    queryFn: () => axios.get(`${API_URL}/scenarios`, {
      params: selectedModel ? { model_id: selectedModel } : {}
    }).then(res => res.data),
  });

  const { data: runnerStatus } = useQuery({
    queryKey: ['runnerStatus'],
    queryFn: () => axios.get(`${API_URL}/system/runner-status`).then(res => res.data),
    refetchInterval: 5000,
  });

  const handleSubmit = async () => {
    if (!selectedModel || !selectedScenario) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/simulations`, {
        model_id: selectedModel,
        scenario_id: selectedScenario,
        requested_by: 'user',
      });
      setSubmittedJob(res.data);
    } catch (e) {
      setError(e.response?.data?.message || t('simCreateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColor = {
    running: 'text-green-500',
    idle:    'text-slate-400',
    queued:  'text-yellow-500',
    offline: 'text-red-500',
  };

  const statusDot = {
    running: 'bg-green-500 animate-pulse',
    idle:    'bg-slate-400',
    queued:  'bg-yellow-400',
    offline: 'bg-red-500',
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto p-4 lg:p-6 space-y-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('simRunTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-dashdark-muted mt-1">{t('simRunDesc')}</p>
      </div>

      {/* Runner Status */}
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
        <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border">
          <CardTitle className="text-sm font-bold text-slate-700 dark:text-dashdark-text flex items-center gap-2">
            <Server className="w-4 h-4 text-violet-500" />
            {t('runnerStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusDot[runnerStatus?.runner_status] || 'bg-slate-300'}`} />
            <span className={`text-sm font-semibold ${statusColor[runnerStatus?.runner_status] || 'text-slate-400'}`}>
              {runnerStatus?.runner_status?.toUpperCase() || 'UNKNOWN'}
            </span>
            {runnerStatus?.active_job_id && (
              <span className="text-xs text-slate-400 ml-2 font-mono">Job: {runnerStatus.active_job_id}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Config */}
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border">
        <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border">
          <CardTitle className="text-sm font-bold text-slate-700 dark:text-dashdark-text flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-500" />
            {t('simConfig')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-dashdark-muted uppercase tracking-wide">
              {t('simModel')}
            </label>
            {modelsLoading ? <Skeleton className="h-10 w-full" /> : (
              <Select
                value={selectedModel}
                onValueChange={val => { setSelectedModel(val); setSelectedScenario(''); }}
              >
                <SelectTrigger className="w-full bg-white dark:bg-dashdark-bg">
                  <SelectValue placeholder={t('selectModel')} />
                </SelectTrigger>
                <SelectContent>
                  {models.length === 0
                    ? <SelectItem value="_none" disabled>{t('noModels')}</SelectItem>
                    : models.map(m => (
                      <SelectItem key={m.model_id} value={m.model_id}>{m.model_name}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Scenario */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-dashdark-muted uppercase tracking-wide">
              {t('simScenario')}
            </label>
            {scenariosLoading ? <Skeleton className="h-10 w-full" /> : (
              <Select
                value={selectedScenario}
                onValueChange={setSelectedScenario}
                disabled={!selectedModel}
              >
                <SelectTrigger className="w-full bg-white dark:bg-dashdark-bg">
                  <SelectValue placeholder={!selectedModel ? t('selectModelFirst') : t('selectScenario')} />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.length === 0
                    ? <SelectItem value="_none" disabled>{t('noScenarios')}</SelectItem>
                    : scenarios.map(s => (
                      <SelectItem key={s.scenario_id} value={s.scenario_id}>{s.scenario_name}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
            disabled={!selectedModel || !selectedScenario || isSubmitting}
            onClick={handleSubmit}
          >
            <Play className="w-4 h-4 mr-2" />
            {isSubmitting ? t('submitting') : t('runSimulation')}
          </Button>
        </CardContent>
      </Card>

      {/* Success */}
      {submittedJob && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700">
            <CardContent className="p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-green-800 dark:text-green-300">{t('simCreated')}</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-mono mt-1">
                  Job ID: {submittedJob.job_id}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => navigate('/simulation/history')}
                >
                  {t('viewHistory')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
