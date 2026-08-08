import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper to get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('nutrisnap_auth_token');
}

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth functions
export async function loginWithEmail(email, password) {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
  return response.data;
}

export async function signupWithEmail(email, password, firstName, lastName) {
  const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, { email, password, first_name: firstName, last_name: lastName });
  return response.data;
}

export async function logout() {
  localStorage.removeItem('nutrisnap_auth_token');
  localStorage.removeItem('nutrisnap_user');
}

export function setAuthToken(token) {
  localStorage.setItem('nutrisnap_auth_token', token);
}

export function getStoredUser() {
  const userStr = localStorage.getItem('nutrisnap_user');
  return userStr ? JSON.parse(userStr) : null;
}

export function setStoredUser(user) {
  localStorage.setItem('nutrisnap_user', JSON.stringify(user));
}

export async function logMealPhoto(photoFile, mealType) {
  const formData = new FormData();
  formData.append('photo', photoFile);
  formData.append('meal_type', mealType);

  const response = await api.post('/api/log-meal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export async function getTodaySummary() {
  const response = await api.get('/api/today-summary');
  return response.data;
}

export async function getUserProfile() {
  const response = await api.get('/api/user');
  return response.data;
}

export async function getAvatarStatus() {
  const response = await api.get('/api/avatar');
  return response.data;
}

export async function scanLabel(photoFile) {
  const formData = new FormData();
  formData.append('photo', photoFile);

  const response = await api.post('/api/scan-label', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export async function setupProfile({ body_type, weight_kg, height_cm, age, gender }) {
  const response = await api.post('/api/setup-profile', {
    body_type,
    weight_kg,
    height_cm,
    age,
    gender,
  });
  return response.data;
}

export async function getMealHistory() {
  const response = await api.get('/api/meal-history');
  return response.data;
}

export async function downloadMonthlyReport() {
  const response = await api.get('/api/monthly-report', {
    responseType: 'blob',
  });
  return response.data;
}