import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Abhi tak login system nahi bana, isliye ek fixed test user_id use kar rahe hain
// Baad mein isse real authentication se replace karenge
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