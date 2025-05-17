import { divisions } from "./divisions.js";

async function getDivisionSeasonsData(divisionId) {
  const url = "https://prod.services.nbl.com.au/api_cache/bbv/synergy";
  const params = new URLSearchParams({
    route: `competitions/${divisionId}/seasons`,
    format: "true"
  });

  try {
    const response = await fetch(`${url}?${params}`);
    if (response.ok) {
      const data = await response.json();
      console.log("Season data:", data);
      // You can add logic here to display data in the UI
    } else {
      console.error("Request failed:", response.status);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// Populate the division select element
const select = document.getElementById("divisionSelect");

divisions.forEach((div) => {
  const option = document.createElement("option");
  option.value = div.id;
  option.textContent = div.name;
  select.appendChild(option);
});

// Listen for user selection
select.addEventListener("change", () => {
  const selectedId = select.value;
  if (selectedId) {
    getDivisionSeasonsData(selectedId);
  }
});
