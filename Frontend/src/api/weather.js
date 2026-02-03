// src/api/weather.js
import api from "./api";

export const getTripWeather = async (city, startDate, endDate) => {
  const res = await api.get("/weather/forecast", {
    params: {
      city,
      start_date: startDate,
      end_date: endDate,
    },
  });
  return res.data;
};
