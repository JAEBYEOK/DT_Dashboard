import axios from "axios";

export const API_URL = "http://localhost:3001/api";

export const apiClient = axios.create({
  baseURL: API_URL,
});

export async function getIntersections() {
  const response = await apiClient.get("/intersections");
  return response.data;
}
