// Fail: utils/telemetry.js

const GAS_URL = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";

export async function hantarTelemetri(muridID, modulID, aktiviti, markah, masaDiambil, gunaScaffolding, laluanAdaptif) {
  const payload = {
    action: "rekodTelemetri",
    payload: { muridID, modulID, aktiviti, markah, masaDiambil, gunaScaffolding, laluanAdaptif }
  };

  try {
    fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("Telemetri dihantar:", aktiviti);
  } catch (error) {
    console.error("Ralat hantar telemetri:", error);
  }
}