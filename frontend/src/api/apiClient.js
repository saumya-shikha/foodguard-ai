const BASE_URL = "http://localhost:5000";

export async function fetchAllData() {
  try {
    const response = await fetch(`${BASE_URL}/`);

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

export async function fetchInsights() {
  try {
    const response = await fetch(`${BASE_URL}/insights`);

    if (!response.ok) {
      throw new Error("Failed to fetch insights");
    }

    return await response.json();
  } catch (error) {
    console.error("Insights Error:", error);
    return [];
  }
}