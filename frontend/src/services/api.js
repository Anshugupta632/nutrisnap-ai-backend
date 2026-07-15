import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const TEST_USER_ID = 'e54ce6ca-ff0d-43f7-854a-1b327351cbee';

export async function logMealPhoto(photoFile, mealType) {
  const formData = new FormData();
  formData.append('photo', photoFile);
  formData.append('user_id', TEST_USER_ID);
  formData.append('meal_type', mealType);

  const response = await axios.post(`${API_BASE_URL}/api/log-meal`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export async function getTodaySummary() {
  const response = await axios.get(`${API_BASE_URL}/api/today-summary/${TEST_USER_ID}`);
  return response.data;
}

export async function getUserProfile() {
  const response = await axios.get(`${API_BASE_URL}/api/user/${TEST_USER_ID}`);
  return response.data;
}