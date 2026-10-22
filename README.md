# ☁️ Little Forecast

A pixel-art weather application that makes checking the weather simple, informative, and fun. Little Forecast allows users to search for locations, view current weather and forecasts, save favourite locations, review weather history, store historical weather records, and export data.

## ✨ Features

- **Current Weather:** Search for a city or location and view current weather conditions.
- **Five-Day Forecast:** View upcoming weather conditions and daily minimum and maximum temperatures.
- **Location Detection:** Use the browser's geolocation feature to retrieve local weather.
- **Saved Locations:** Add, view, reorder, and remove saved locations.
- **Search History:** Automatically record successful weather searches and manage previous entries.
- **Historical Weather Records:** Select a location and date range to retrieve historical temperatures.
- **Database CRUD:** Create, read, update, and delete weather records using Supabase.
- **CSV Export:** Download stored weather records as a CSV file.
- **Google Maps Integration:** View a searched location on an embedded Google Map.
- **Responsive Interface:** A custom pixel-art design with a dark, pastel colour palette.

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- Open-Meteo Geocoding API
- Open-Meteo Weather Forecast API
- Open-Meteo Historical Weather API
- Supabase PostgreSQL database
- Google Maps embed

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- Visual Studio Code or another code editor
- The Live Server extension for Visual Studio Code
- A Supabase account and project

### Installation

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Ensure the project contains the `index.html`, `css/`, `js/`, and `assets/` files and folders.
4. Open `js/supabase.js`.
5. Configure your Supabase project URL and publishable API key as described below.
6. Open `index.html` using Live Server.
7. Explore the application in your browser.

### Supabase Configuration

Little Forecast uses Supabase to store historical weather records.

Create a Supabase project and execute the database table SQL provided for the `weather_records` table. Configure the required database permissions and Row Level Security policies.

In `js/supabase.js`, configure your project credentials:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
```

The application loads the Supabase JavaScript client through a CDN.

**Security note:** Never expose a Supabase secret or service-role key in client-side code. Database permissions should be restricted appropriately before deploying the application publicly.

### API Information

**Open-Meteo:** Used for location search, current weather, forecasts, and historical weather data.

- Website: https://open-meteo.com/
- Geocoding API: https://geocoding-api.open-meteo.com/
- Forecast API: https://api.open-meteo.com/
- Historical Weather API: https://archive-api.open-meteo.com/

**Google Maps:** Used to display a map of the selected location using its coordinates.

## 📁 Project Structure

```text
little-forecast/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── supabase.js
├── assets/
│   └── icons/
└── README.md
```

## 📦 Dependencies

The application uses browser-native HTML, CSS, and JavaScript, together with external APIs and the Supabase JavaScript client loaded through a CDN.

No Python packages or Node.js package installation are required for the current setup. Therefore, a Python `requirements.txt` file is not applicable.

## 👩‍💻 Developer

**YOUR NAME**

Created as a weather application project demonstrating frontend development, API integration, database operations, data validation, and data export.

## 📄 License

This project is submitted for evaluation and educational purposes.
