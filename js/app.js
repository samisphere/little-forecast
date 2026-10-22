const searchForm = document.querySelector("#search-form");
const locationInput = document.querySelector("#location-input");
const statusMessage = document.querySelector("#status-message");

const ICONS = "assets/icons/";

const weatherElements = {
  form: document.querySelector("#search-form"),
  input: document.querySelector("#location-input"),
  status: document.querySelector("#status-message"),
  location: document.querySelector("#weather-location"),
  date: document.querySelector("#weather-date"),
  temperature: document.querySelector("#temperature"),
  condition: document.querySelector("#weather-condition"),
  icon: document.querySelector("#weather-icon"),
  feelsLike: document.querySelector("#feels-like"),
  humidity: document.querySelector("#humidity"),
  wind: document.querySelector("#wind"),
  forecast: document.querySelector("#forecast-list"),
};

function getWeatherInfo(code) {
  if (code === 0) {
    return { text: "Sunny", icon: "sunny.png" };
  }

  if ([1, 2].includes(code)) {
    return { text: "Partly cloudy", icon: "sun_cloud.png" };
  }

  if (code === 3) {
    return { text: "Cloudy", icon: "cloud.png" };
  }

  if ([45, 48].includes(code)) {
    return { text: "Foggy", icon: "purple_cloud.png" };
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { text: "Rain", icon: "rain.png" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { text: "Snow", icon: "snow.png" };
  }

  if ([95, 96, 99].includes(code)) {
    return { text: "Thunderstorm", icon: "thunder.png" };
  }

  return { text: "Weather unavailable", icon: "cloud.png" };
}

async function findLocation(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");

  url.search = new URLSearchParams({
    name: query,
    count: "1",
    language: "en",
    format: "json",
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not search for this location.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Location not found. Try another city or postcode.");
  }

  return data.results[0];
}

async function getWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");

  url.search = new URLSearchParams({
    latitude,
    longitude,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    daily: ["weather_code", "temperature_2m_max", "temperature_2m_min"].join(
      ",",
    ),
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    forecast_days: "5",
    timezone: "auto",
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather service is unavailable. Try again.");
  }

  return response.json();
}

const currentLocationButton = document.querySelector("#current-location");

currentLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    weatherElements.status.textContent =
      "Your browser does not support location detection.";
    return;
  }

  weatherElements.status.textContent = "Finding your location...";
  currentLocationButton.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        weatherElements.status.textContent = "Getting your local weather...";

        const data = await getWeather(latitude, longitude);

        displayWeather(
          {
            name: "Your Location",
            country: "",
            latitude: latitude,
            longitude: longitude,
          },
          data,
        );

        weatherElements.status.textContent = "";
      } catch (error) {
        weatherElements.status.textContent =
          "Could not fetch weather. Check your internet connection and try again.";
        console.error("Weather request failed:", error);
      } finally {
        currentLocationButton.disabled = false;
      }
    },

    (error) => {
      const messages = {
        1: "Location permission denied. Please allow access in your browser settings.",
        2: "Your location could not be determined. Please try again.",
        3: "The location request timed out. Please try again.",
      };

      weatherElements.status.textContent =
        messages[error.code] || "Could not access your location.";

      currentLocationButton.disabled = false;
    },

    {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 300000,
    },
  );
});

function displayWeather(place, data) {
  const current = data.current;
  const info = getWeatherInfo(current.weather_code);

  weatherElements.location.textContent = [place.name, place.country]
    .filter(Boolean)
    .join(", ");

  weatherElements.date.textContent = `Local time: ${data.current.time.replace("T", " ")}`;

  weatherElements.temperature.textContent = Math.round(current.temperature_2m);

  weatherElements.condition.textContent = info.text;

  weatherElements.icon.src = ICONS + info.icon;
  weatherElements.icon.alt = info.text;

  weatherElements.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;

  weatherElements.humidity.textContent = `${current.relative_humidity_2m}%`;

  weatherElements.wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;

  displayForecast(data.daily);
  addWeatherToHistory(place, data);
  updateWeatherMap(place.latitude, place.longitude);
}

function displayForecast(daily) {
  weatherElements.forecast.replaceChildren();

  daily.time.forEach((date, index) => {
    const info = getWeatherInfo(daily.weather_code[index]);

    const card = document.createElement("article");
    card.className = "forecast-card";

    const day = document.createElement("p");
    day.textContent =
      index === 0
        ? "Today"
        : new Date(`${date}T12:00:00`).toLocaleDateString("en", {
            weekday: "short",
          });

    const dateLabel = document.createElement("p");
    dateLabel.className = "muted";
    dateLabel.textContent = new Date(`${date}T12:00:00`).toLocaleDateString(
      "en",
      {
        month: "short",
        day: "numeric",
      },
    );

    const icon = document.createElement("img");
    icon.src = ICONS + info.icon;
    icon.alt = info.text;

    const temperatures = document.createElement("p");
    temperatures.className = "forecast-temp";
    temperatures.textContent =
      `${Math.round(daily.temperature_2m_min[index])}° – ` +
      `${Math.round(daily.temperature_2m_max[index])}°`;

    const condition = document.createElement("p");
    condition.className = "condition";
    condition.textContent = info.text;

    card.append(day, dateLabel, icon, temperatures, condition);
    weatherElements.forecast.appendChild(card);
  });
}

async function searchWeather(query) {
  weatherElements.status.textContent = "Loading weather...";

  try {
    const place = await findLocation(query);
    const data = await getWeather(place.latitude, place.longitude);

    displayWeather(place, data);
    weatherElements.status.textContent = "";
  } catch (error) {
    weatherElements.status.textContent =
      error.message || "Something went wrong. Please try again.";
  }
}

weatherElements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const query = weatherElements.input.value.trim();

  if (!query) {
    weatherElements.status.textContent = "Please enter a city or location.";
    return;
  }

  searchWeather(query);
});

searchWeather("Doha");

const savedList = document.querySelector("#saved-locations-list");
const addButton = document.querySelector("#add-location-btn");
const addForm = document.querySelector("#add-location-form");
const savedInput = document.querySelector("#saved-location-input");
const savedStatus = document.querySelector("#saved-status");
const cancelAddButton = document.querySelector("#cancel-add-location");

const STORAGE_KEY = "littleForecastSavedLocations";

let savedLocations = loadSavedLocations();
let draggedCardId = null;

function loadSavedLocations() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveLocations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLocations));
}

function createLocationId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatSavedDate() {
  return new Date().toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSavedTime(time) {
  if (!time) return "--:--";

  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function renderSavedLocations() {
  savedList.replaceChildren();

  if (savedLocations.length === 0) {
    const empty = document.createElement("p");
    empty.className = "saved-empty";
    empty.textContent =
      "No saved locations yet. Click “Add Location” to get started.";
    savedList.appendChild(empty);
    return;
  }

  savedLocations.forEach((place) => {
    const card = document.createElement("article");
    card.className = "saved-location-card";
    card.dataset.id = place.id;

    const handle = document.createElement("button");
    handle.className = "drag-handle";
    handle.type = "button";
    handle.draggable = true;
    handle.setAttribute("aria-label", `Reorder ${place.name}`);

    const dragIcon = document.createElement("img");
    dragIcon.src = "assets/icons/drag.png";
    dragIcon.alt = "";
    dragIcon.className = "drag-icon";

    handle.appendChild(dragIcon);

    const icon = document.createElement("img");
    icon.className = "saved-weather-icon";
    icon.src = `assets/icons/${place.icon || "cloud.png"}`;
    icon.alt = place.condition || "Weather";
    icon.onerror = () => {
      icon.onerror = null;
      icon.src = "assets/icons/cloud.png";
    };

    const details = document.createElement("div");

    const name = document.createElement("h3");
    name.className = "saved-location-name";
    name.textContent = [place.name, place.country].filter(Boolean).join(", ");

    const date = document.createElement("p");
    date.className = "saved-location-date";
    date.textContent = place.date || formatSavedDate();

    details.append(name, date);

    const weather = document.createElement("div");

    const time = document.createElement("p");
    time.className = "saved-location-time";
    time.textContent = formatSavedTime(place.time);

    const condition = document.createElement("p");
    condition.className = "saved-weather-condition";
    condition.textContent = place.condition || "Loading weather…";

    weather.append(time, condition);

    const temperature = document.createElement("strong");
    temperature.className = "saved-temperature";
    temperature.textContent = Number.isFinite(place.temperature)
      ? `${Math.round(place.temperature)}°C`
      : "—°C";

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-location-btn";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete ${place.name}`);
    deleteButton.title = "Delete location";

    const trashIcon = document.createElement("img");
    trashIcon.src = "assets/icons/delete.png";
    trashIcon.alt = "";
    trashIcon.className = "trash-icon";

    deleteButton.appendChild(trashIcon);

    deleteButton.setAttribute("aria-label", `Delete ${place.name}`);
    deleteButton.title = "Delete location";

    deleteButton.addEventListener("click", () => {
      savedLocations = savedLocations.filter((item) => item.id !== place.id);
      saveLocations();
      renderSavedLocations();
      savedStatus.textContent = `${place.name} removed from saved locations.`;
    });

    handle.addEventListener("dragstart", (event) => {
      draggedCardId = place.id;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", place.id);
      card.classList.add("dragging");
    });

    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (draggedCardId !== place.id) {
        card.classList.add("drag-over");
      }
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("drag-over");

      const sourceId =
        draggedCardId || event.dataTransfer.getData("text/plain");

      if (!sourceId || sourceId === place.id) return;

      const fromIndex = savedLocations.findIndex(
        (item) => item.id === sourceId,
      );
      const toIndex = savedLocations.findIndex((item) => item.id === place.id);

      if (fromIndex < 0 || toIndex < 0) return;

      const [movedPlace] = savedLocations.splice(fromIndex, 1);
      savedLocations.splice(toIndex, 0, movedPlace);

      saveLocations();
      renderSavedLocations();
    });

    card.addEventListener("dragend", () => {
      draggedCardId = null;
      document.querySelectorAll(".saved-location-card").forEach((item) => {
        item.classList.remove("dragging", "drag-over");
      });
    });

    card.append(handle, icon, details, weather, temperature, deleteButton);
    savedList.appendChild(card);
  });
}

addButton.addEventListener("click", () => {
  addForm.hidden = !addForm.hidden;

  if (!addForm.hidden) {
    savedInput.focus();
    savedStatus.textContent = "";
  }
});

cancelAddButton.addEventListener("click", () => {
  addForm.hidden = true;
  savedInput.value = "";
  savedStatus.textContent = "";
});

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = savedInput.value.trim();
  if (!query) return;

  savedStatus.textContent = "Searching for location…";
  addForm.querySelector('button[type="submit"]').disabled = true;

  try {
    const place = await findLocation(query);

    const alreadySaved = savedLocations.some(
      (item) =>
        Math.abs(item.latitude - place.latitude) < 0.001 &&
        Math.abs(item.longitude - place.longitude) < 0.001,
    );

    if (alreadySaved) {
      savedStatus.textContent = "This location is already saved.";
      return;
    }

    const data = await getWeather(place.latitude, place.longitude);

    const current = data.current;
    const info = getWeatherInfo(current.weather_code);

    const savedPlace = {
      id: createLocationId(),
      name: place.name,
      country: place.country || "",
      latitude: place.latitude,
      longitude: place.longitude,
      temperature: current.temperature_2m,
      condition: info.text,
      icon: info.icon,
      time: current.time,
      date: formatSavedDate(),
    };

    savedLocations.push(savedPlace);
    saveLocations();
    renderSavedLocations();

    savedInput.value = "";
    addForm.hidden = true;
    savedStatus.textContent = `${place.name} added to your saved locations!`;
  } catch (error) {
    savedStatus.textContent =
      error.message || "Could not add this location. Please try again.";
  } finally {
    addForm.querySelector('button[type="submit"]').disabled = false;
  }
});

renderSavedLocations();

const pageSections = document.querySelectorAll(".page-section");
const navItems = document.querySelectorAll(".nav-item");

function showPage(pageId) {
  pageSections.forEach((section) => {
    section.classList.toggle("active", section.id === pageId);
  });

  navItems.forEach((item) => {
    const isActive = item.getAttribute("href") === `#${pageId}`;
    item.classList.toggle("active", isActive);
  });
}

navItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    const pageId = item.getAttribute("href")?.slice(1);

    if (document.getElementById(pageId)?.classList.contains("page-section")) {
      event.preventDefault();
      showPage(pageId);
    }
  });
});

showPage("home");

const historyList = document.querySelector("#history-list");
const clearHistoryButton = document.querySelector("#clear-history-btn");
const historyStatus = document.querySelector("#history-status");

const HISTORY_KEY = "littleForecastHistory";

function loadWeatherHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

let weatherHistory = loadWeatherHistory();

function saveWeatherHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(weatherHistory));
}

function addWeatherToHistory(place, data) {
  const current = data.current;
  const weather = getWeatherInfo(current.weather_code);
  const now = new Date();

  const entry = {
    id: `${now.getTime()}-${Math.random()}`,
    city: place.name || "Unknown location",
    country: place.country || "",
    date: now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    temperature: current.temperature_2m,
    condition: weather.condition,
    icon: weather.icon,
  };

  weatherHistory.unshift(entry);

  weatherHistory = weatherHistory.slice(0, 50);

  saveWeatherHistory();
  renderWeatherHistory();
}

function renderWeatherHistory() {
  historyList.innerHTML = "";

  if (weatherHistory.length === 0) {
    historyList.textContent =
      "No search history yet. Search for a city on Home!";
    return;
  }

  weatherHistory.forEach((item) => {
    const card = document.createElement("article");
    card.className = "history-card";

    const icon = document.createElement("img");
    icon.className = "history-weather-icon";
    icon.src = `assets/icons/${item.icon}`;
    icon.alt = item.condition;

    const location = document.createElement("div");
    location.className = "history-location";

    const city = document.createElement("h3");
    city.textContent = item.country
      ? `${item.city}, ${item.country}`
      : item.city;

    const date = document.createElement("p");
    date.textContent = item.date;

    location.append(city, date);

    const details = document.createElement("div");
    details.className = "history-details";

    const time = document.createElement("p");
    time.textContent = item.time;

    const condition = document.createElement("p");
    condition.textContent = item.condition;

    details.append(time, condition);

    const temperature = document.createElement("p");
    temperature.className = "history-temperature";
    temperature.textContent = `${Math.round(item.temperature)}°C`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "history-delete-btn";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete ${item.city} history`);

    const deleteIcon = document.createElement("img");
    deleteIcon.src = "assets/icons/delete.png";
    deleteIcon.alt = "";

    deleteButton.appendChild(deleteIcon);

    deleteButton.addEventListener("click", () => {
      weatherHistory = weatherHistory.filter((entry) => entry.id !== item.id);

      saveWeatherHistory();
      renderWeatherHistory();
    });

    card.append(icon, location, details, temperature, deleteButton);
    historyList.appendChild(card);
  });
}

clearHistoryButton.addEventListener("click", () => {
  if (weatherHistory.length === 0) {
    historyStatus.textContent = "Your history is already empty.";
    return;
  }

  weatherHistory = [];
  saveWeatherHistory();
  renderWeatherHistory();
  historyStatus.textContent = "All history cleared.";
});

renderWeatherHistory();

const recordForm = document.querySelector("#record-form");
const recordLocationInput = document.querySelector("#record-location");
const recordStartInput = document.querySelector("#record-start");
const recordEndInput = document.querySelector("#record-end");
const recordStatus = document.querySelector("#record-status");
const databaseRecords = document.querySelector("#database-records");
const saveRecordButton = document.querySelector("#save-record-btn");

async function loadDatabaseRecords() {
  databaseRecords.textContent = "Loading records...";

  const { data, error } = await supabaseClient
    .from("weather_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    databaseRecords.textContent = "Could not load records.";
    console.error("Read records failed:", error.message);
    return;
  }

  databaseRecords.innerHTML = "";

  if (!data.length) {
    databaseRecords.textContent = "No database records yet.";
    return;
  }

  data.forEach((record) => {
    const card = document.createElement("article");
    card.className = "database-record-card";

    const title = document.createElement("h3");
    title.textContent = record.country
      ? `${record.location_name}, ${record.country}`
      : record.location_name;

    const dates = document.createElement("p");
    dates.textContent = `${record.start_date} to ${record.end_date}`;

    const temperatures = document.createElement("div");
    temperatures.className = "record-temperatures";

    const heading = document.createElement("p");
    heading.textContent = "Daily temperatures:";

    temperatures.appendChild(heading);

    record.weather_data.forEach((day) => {
      const row = document.createElement("p");
      const average =
        day.temperature_mean == null ? "N/A" : `${day.temperature_mean}°C`;

      row.textContent = `${day.date}: ${average} (Low ${day.temperature_min ?? "N/A"}°C, High ${day.temperature_max ?? "N/A"}°C)`;
      temperatures.appendChild(row);
    });

    // Edit button
    const editButton = document.createElement("button");
    editButton.textContent = "Edit dates";
    editButton.className = "record-edit-btn";

    editButton.addEventListener("click", async () => {
      const newStart = prompt(
        "Enter the new start date (YYYY-MM-DD):",
        record.start_date,
      );
      if (newStart === null) return;

      const newEnd = prompt(
        "Enter the new end date (YYYY-MM-DD):",
        record.end_date,
      );
      if (newEnd === null) return;

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(newStart) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(newEnd) ||
        newStart > newEnd
      ) {
        alert(
          "Please enter valid dates. The start date must be on or before the end date.",
        );
        return;
      }

      const { error } = await supabaseClient
        .from("weather_records")
        .update({
          start_date: newStart,
          end_date: newEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      if (error) {
        alert(`Could not update record: ${error.message}`);
        return;
      }

      await loadDatabaseRecords();
    });

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "record-delete-btn";

    deleteButton.addEventListener("click", async () => {
      if (!confirm(`Delete the weather record for ${record.location_name}?`)) {
        return;
      }

      const { error } = await supabaseClient
        .from("weather_records")
        .delete()
        .eq("id", record.id);

      if (error) {
        alert(`Could not delete record: ${error.message}`);
        return;
      }

      await loadDatabaseRecords();
    });

    card.append(title, dates, temperatures, editButton, deleteButton);
    databaseRecords.appendChild(card);
  });
}

recordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = recordLocationInput.value.trim();
  const startDate = recordStartInput.value;
  const endDate = recordEndInput.value;

  if (!query || !startDate || !endDate) {
    recordStatus.textContent = "Please fill in all fields.";
    return;
  }

  if (startDate > endDate) {
    recordStatus.textContent =
      "Start date must be before or equal to end date.";
    return;
  }

  const latestArchiveDate = new Date();
  latestArchiveDate.setDate(latestArchiveDate.getDate() - 5);
  const latestAllowed = latestArchiveDate.toISOString().slice(0, 10);

  if (endDate > latestAllowed) {
    recordStatus.textContent = `For this historical-data version, choose an end date on or before ${latestAllowed}.`;
    return;
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = (end - start) / 86400000 + 1;

  if (days > 366) {
    recordStatus.textContent =
      "Please select a date range of one year or less.";
    return;
  }

  saveRecordButton.disabled = true;
  recordStatus.textContent =
    "Finding location and fetching historical weather...";

  try {
    const place = await findLocation(query);

    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      start_date: startDate,
      end_date: endDate,
      daily: "temperature_2m_mean,temperature_2m_min,temperature_2m_max",
      timezone: "auto",
    });

    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?${params}`,
    );

    if (!response.ok) {
      throw new Error(
        "Historical weather service could not return this date range.",
      );
    }

    const weather = await response.json();

    if (!weather.daily?.time?.length) {
      throw new Error("No weather data was found for those dates.");
    }

    const dailyRecords = weather.daily.time.map((date, index) => ({
      date,
      temperature_mean: weather.daily.temperature_2m_mean[index],
      temperature_min: weather.daily.temperature_2m_min[index],
      temperature_max: weather.daily.temperature_2m_max[index],
    }));

    const { error } = await supabaseClient.from("weather_records").insert({
      location_name: place.name,
      country: place.country || "",
      latitude: place.latitude,
      longitude: place.longitude,
      start_date: startDate,
      end_date: endDate,
      weather_data: dailyRecords,
    });

    if (error) {
      throw new Error(error.message);
    }

    recordStatus.textContent = "Weather record saved successfully!";
    recordForm.reset();
    await loadDatabaseRecords();
  } catch (error) {
    console.error("Create record failed:", error);
    recordStatus.textContent =
      error.message || "Something went wrong. Please try again.";
  } finally {
    saveRecordButton.disabled = false;
  }
});

loadDatabaseRecords();

/* ===== GOOGLE MAPS ===== */

function updateWeatherMap(latitude, longitude) {
  const map = document.querySelector("#weather-map");

  if (!map) return;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return;
  }

  const coordinates = `${latitude},${longitude}`;

  map.src = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&z=11&output=embed`;
}

const exportCsvButton = document.querySelector("#export-csv-btn");

exportCsvButton.addEventListener("click", async () => {
  exportCsvButton.disabled = true;

  try {
    const { data, error } = await supabaseClient
      .from("weather_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.length) {
      alert("There are no weather records to export yet.");
      return;
    }

    const columns = [
      "id",
      "location_name",
      "country",
      "latitude",
      "longitude",
      "start_date",
      "end_date",
      "weather_data",
      "created_at",
      "updated_at",
    ];

    const escapeCsv = (value) => {
      const text =
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : String(value ?? "");

      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
      columns.join(","),
      ...data.map((record) =>
        columns.map((column) => escapeCsv(record[column])).join(","),
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "little-forecast-weather-records.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("CSV export failed:", error);
    alert(`Could not export records: ${error.message}`);
  } finally {
    exportCsvButton.disabled = false;
  }
});
