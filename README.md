# Food Safety Data Dashboard

Full-stack dashboard with:
- **Frontend**: React (Vite) + Recharts + clean CSS (no Tailwind)
- **Backend**: Node.js + Express REST API
- **Dataset**: India-focused synthetic-but-realistic dataset (states, years, categories)
- **AI features (offline)**: Insights endpoint that generates summary, anomalies, and a simple forecast (no API key required)

> Note: This project is designed to run **as-is** on Windows with Node.js installed.

## What this project does

This dashboard helps you explore food contamination cases across:
- **State-wise contamination** (stacked bars by food category)
- **Year-wise trends** (multi-line chart by category)
- **Food category distribution** (pie chart)
- **AI Insights** (summary + anomaly detection + next-year forecast + recommendations)
- **Data Explorer** (table preview of filtered records + table-only state selector)

All charts are computed from live API data (no hardcoded chart values).

## Folder Structure

```
food/
  backend/
    package.json
    data/
      dataset.json
    src/
      server.js
      routes/
        dataRoutes.js
      services/
        datasetService.js
      scripts/
        generateIndiaDataset.js
  frontend/
    package.json
    vite.config.js
    index.html
    src/
      main.jsx
      App.jsx
      api/
        apiClient.js
      components/
        Sidebar.jsx
        Topbar.jsx
        Filters.jsx
        KPICards.jsx
        ChartsPanel.jsx
        AIInsights.jsx
        DataTable.jsx
      hooks/
        useFoodData.js
      styles.css
  README.md
```

## Backend (Express API)

### Data model (dataset schema)

Each record in `backend/data/dataset.json`:

```json
{
  "state": "Maharashtra",
  "year": 2022,
  "food_category": "Ready-to-Eat Foods",
  "contamination_cases": 560
}
```

### REST endpoints

- **`GET /data`**
  - Returns the full dataset array.
- **`GET /state/:name`**
  - Returns records for a specific state (case-insensitive).
  - Example: `GET /state/Delhi`
- **`GET /year/:year`**
  - Returns records for a specific year.
  - Example: `GET /year/2022`
- **`GET /insights?state=&year=&category=`**
  - Returns “AI Insights” computed from the dataset.
  - Query params are optional and support `"All"`:
    - `state` (string)
    - `year` (number)
    - `category` (string)
  - Example: `GET /insights?state=Delhi&year=2022`

### AI Insights (offline) explained

The “AI” features are rule/statistics based and require **no API keys**:
- **Summary totals**: records, total cases, unique states/years/categories
- **Top state/category**: based on aggregated cases
- **Forecast**: simple linear regression over yearly totals to predict next year’s cases
- **Anomalies**: top outliers in the current filter slice (≥ ~90th percentile)
- **Recommendations**: short action items derived from the above

### Dataset generation script

`backend/src/scripts/generateIndiaDataset.js` can regenerate a richer dataset:
- Multiple Indian states/regions
- Multiple years (2018–2024)
- Multiple categories
- Controlled randomness + rare spikes for realistic-looking charts

Run it:

```bash
cd backend
node src/scripts/generateIndiaDataset.js
```

Then restart the backend server to load the updated JSON.

## Frontend (React + Vite)

### Key UI pieces

- **Sidebar** (`frontend/src/components/Sidebar.jsx`)
  - Relevant working navigation:
    - Overview → scrolls to filters
    - Analytics → scrolls to charts
    - Data Explorer → scrolls to table
- **Topbar** (`frontend/src/components/Topbar.jsx`)
  - Shows welcome message (**Welcome, Saumya**) and admin name (**SAUMYA SHIKHA**)
  - Search input filters records by state/category/year text
- **Filters** (`Filters.jsx`)
  - State, Year, Food Category
  - Options are derived from the fetched dataset (no hardcoding)
- **KPI Cards** (`KPICards.jsx`)
  - Total Cases, Unique States, Unique Categories, Avg. Cases/Record
- **Charts** (`ChartsPanel.jsx`)
  - State-wise contamination: **stacked bar** (by food category)
  - Year-wise trends: **multi-line** (by category)
  - Pie chart: category distribution
  - Plus additional supporting panels (top states, area total trend, scatter)
- **AI Insights** (`AIInsights.jsx`)
  - Calls `GET /insights` with the current filters and renders:
    - top state/category
    - anomalies list
    - forecast
    - recommendations
- **Data Explorer** (`DataTable.jsx`)
  - Table preview of filtered records
  - Includes a **table-only state selector** to browse data quickly

### Data flow (how filtering updates charts)

1. Frontend loads all rows once from `GET /data`
2. Filters (state/year/category + search) are applied in `App.jsx`
3. Charts and KPIs are computed from the filtered rows using `useMemo`
4. AI Insights fetches from `GET /insights` using the same filter values

No chart contains hardcoded values; everything comes from the dataset.

## Run Instructions (step-by-step)

### 1) Start the backend

In `food/backend`:

```bash
npm install
npm start
```

Backend runs on `http://localhost:5000`.

### 2) Start the frontend

In `food/frontend` (new terminal):

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, but if the port is busy Vite will automatically use another (e.g. 5174/5175/5176).

## Troubleshooting

### “Port 5173 is already in use”

This is normal when multiple Vite servers are running. The project is configured to **fall back to the next available port**.

### “Failed to fetch” in the dashboard

Usually means the backend is not running.
- Ensure backend is running at `http://localhost:5000`
- Test in browser: `http://localhost:5000/data`

### Backend doesn’t reflect updated dataset

The backend loads `dataset.json` at startup, so after changing it:
- stop backend
- start backend again (`npm start`)

## Commands summary

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

