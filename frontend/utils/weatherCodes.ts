export function getWeatherIconName(weatherCode: number, isNight: boolean): string {
  // Adjust weather codes for night time icons
  if (isNight) {
    if (weatherCode === 0) {
      return "moon-outline"; // Clear sky at night
    } else if (weatherCode === 1) {
      return "moon-outline"; // Mainly clear at night
    }
  }
  return weatherCodeIconMap[weatherCode] || "help-circle-outline";
}

export const weatherCodeIconMap: Record<number, string> = {
  0: "sunny-outline",          // Clear sky
  1: "partly-sunny-outline",   // Mainly clear
  2: "cloud-outline",          // Partly cloudy
  3: "cloudy-outline",         // Cloudy
  45: "cloud-outline",         // Fog
  48: "cloud-outline",         // Depositing rime fog
  51: "rainy-outline",         // Light drizzle
  53: "rainy-outline",         // Moderate drizzle
  55: "rainy-outline",         // Dense drizzle
  61: "rainy-outline",         // Slight rain
  63: "rainy-outline",         // Moderate rain
  65: "rainy-outline",         // Heavy rain
  71: "snow-outline",          // Slight snow fall
  73: "snow-outline",          // Moderate snow fall
  75: "snow-outline",          // Heavy snow fall
  80: "rainy-outline",         // Rain showers
  81: "rainy-outline",         // Heavy rain showers
  82: "rainy-outline",         // Violent rain showers
  85: "snow-outline",          // Snow showers
  86: "snow-outline",          // Heavy snow showers
  95: "thunderstorm-outline",  // Thunderstorm
  96: "thunderstorm-outline",  // Thunderstorm with slight hail
  99: "thunderstorm-outline",  // Thunderstorm with heavy hail
};