import { apiClient } from "./api";

export async function getSimulationModels() {
  const response = await apiClient.get("/vissim/models");
  return response.data;
}

export async function getScenarios(params = {}) {
  const response = await apiClient.get("/scenarios", { params });
  return response.data;
}

export async function createSimulationJob(payload) {
  const response = await apiClient.post("/simulations", payload);
  return response.data;
}

export async function getSimulationJobs(params = {}) {
  const response = await apiClient.get("/simulations", { params });
  return response.data;
}

export async function getSimulationJob(jobId) {
  const response = await apiClient.get(`/simulations/${jobId}`);
  return response.data;
}

export async function getRunnerStatus() {
  const response = await apiClient.get("/system/runner-status");
  return response.data;
}
