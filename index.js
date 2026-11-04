const button = document.querySelector("#get-weather-button");
const errorBox = document.querySelector(".error");

function cleanText(text) {
  return text.trim().toLowerCase();
}

function findLocation(results, city, province, country) {
  return results.find((location) => {
    const locationProvince = (location.admin1 || "").replace(" Region", "");

    return (
      cleanText(location.name) === cleanText(city) &&
      cleanText(locationProvince) === cleanText(province) &&
      cleanText(location.country) === cleanText(country)
    );
  });
}

async function getLocation(city, province, country) {
  const cityName = encodeURIComponent(city.trim());
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}` +
    "&count=100&language=en&format=json";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not connect to the location service.");
  }

  const data = await response.json();
  const location = findLocation(data.results || [], city, province, country);

  if (!location) {
    throw new Error("Location not found. Please check your information.");
  }

  return location;
}

async function getWeather(latitude, longitude) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}` +
    "&current=temperature_2m,apparent_temperature,wind_speed_10m,relative_humidity_2m" +
    "&wind_speed_unit=kmh";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not connect to the weather service.");
  }

  const data = await response.json();

  if (!data.current) {
    throw new Error("Weather information is not available.");
  }

  return data.current;
}

function showWeather(location, weather) {
  document.querySelector("#location-value").textContent =
    `${location.name}, ${location.admin1}, ${location.country}`;
  document.querySelector("#temperature-value").textContent =
    `${weather.temperature_2m}°C`;
  document.querySelector("#feels-like-value").textContent =
    `${weather.apparent_temperature}°C`;
  document.querySelector("#wind-speed-value").textContent =
    `${weather.wind_speed_10m} km/h`;
  document.querySelector("#humidity-value").textContent =
    `${weather.relative_humidity_2m}%`;
}

function clearWeather() {
  document.querySelector("#location-value").textContent = "";
  document.querySelector("#temperature-value").textContent = "";
  document.querySelector("#feels-like-value").textContent = "";
  document.querySelector("#wind-speed-value").textContent = "";
  document.querySelector("#humidity-value").textContent = "";
}

button.addEventListener("click", async function () {
  const city = document.querySelector("#city").value;
  const province = document.querySelector("#province").value;
  const country = document.querySelector("#country").value;

  errorBox.textContent = "";

  if (!city.trim() || !province.trim() || !country.trim()) {
    errorBox.textContent = "Please fill in all the fields.";
    return;
  }

  clearWeather();

  try {
    const location = await getLocation(city, province, country);
    const weather = await getWeather(location.latitude, location.longitude);
    showWeather(location, weather);
  } catch (error) {
    if (error instanceof TypeError) {
      errorBox.textContent = "There was a network error. Please try again.";
    } else {
      errorBox.textContent = error.message;
    }
  }
});
