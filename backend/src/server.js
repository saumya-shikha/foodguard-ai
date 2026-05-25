const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const dataRoutes = require("./routes/dataRoutes");

const { loadDatasetOrThrow } = require("./services/datasetService");

// Create app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Load dataset once at startup.
loadDatasetOrThrow();

// Routes
app.use("/", dataRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `No route matches ${req.method} ${req.originalUrl}`,
  });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err?.message ?? "Unexpected error",
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(port, () => {
  console.log(`Food Safety API listening on http://localhost:${port}`);
});

