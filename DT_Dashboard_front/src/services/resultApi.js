import { apiClient } from "./api";

export async function getComparisonResult(params = {}) {
  const response = await apiClient.get("/results/comparison", { params });
  return response.data;
}

export async function getIntersectionResults(params = {}) {
  const response = await apiClient.get("/results/intersections", { params });
  return response.data;
}

export async function getIntersectionResult(intersectionId, params = {}) {
  const response = await apiClient.get(`/results/intersections/${intersectionId}`, { params });
  return response.data;
}

export async function getRouteResults(params = {}) {
  const response = await apiClient.get("/results/routes", { params });
  return response.data;
}
