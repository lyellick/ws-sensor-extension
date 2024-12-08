const endpoint = "";

chrome.runtime.onInstalled.addListener(() => {
  console.log(`[${new Date().toISOString()}] Extension installed or updated.`);

  // Initial icon set
  if (chrome.action) {
    console.log(`[${new Date().toISOString()}] Setting initial icon to "high".`);
    chrome.action.setIcon({ path: "icons/icon-high.png" });
  } else {
    console.error(`[${new Date().toISOString()}] chrome.action is undefined.`);
  }

  // Start periodic fetching of sensor data
  console.log(`[${new Date().toISOString()}] Creating an alarm for periodic updates.`);
  chrome.alarms.create("updateIcon", { periodInMinutes: 1 });
});

// Function to convert UTC timestamp to CST and validate the range
function isTimestampValid(timestamp) {
  const currentTime = new Date();
  const timestampDate = new Date(timestamp);

  console.log(`[${new Date().toISOString()}] Validating timestamp: ${timestamp}`);

  // Convert both dates to CST
  const options = { timeZone: "America/Chicago", hour12: false };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const currentTimeCST = new Date(formatter.format(currentTime));
  const timestampCST = new Date(formatter.format(timestampDate));

  // Calculate the absolute difference in minutes
  const diffInMinutes = Math.abs((currentTimeCST - timestampCST) / (1000 * 60));
  console.log(`[${new Date().toISOString()}] Difference in minutes: ${diffInMinutes}`);

  // Return true if the difference is less than 2 minutes
  return diffInMinutes < 2;
}

// Function to check API health
async function checkApiHealth() {
  try {
    console.log(`[${new Date().toISOString()}] Checking API health.`);
    const healthResponse = await fetch(`${endpoint}/health`);
    console.log(`[${new Date().toISOString()}] API health check status: ${healthResponse.status}`);
    return healthResponse.status === 200;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error checking API health:`, error);
    return false;
  }
}

// Periodic update of the icon based on data
async function updateIcon() {
  console.log(`[${new Date().toISOString()}] Starting icon update.`);
  try {
    let iconPath;

    // Check API health before fetching data
    const isHealthy = await checkApiHealth();
    if (!isHealthy) {
      console.error(`[${new Date().toISOString()}] API is down. Setting error icon.`);
      iconPath = { 16: "icons/icon-error.png", 48: "icons/icon-error.png", 128: "icons/icon-error.png" };
    } else {
      console.log(`[${new Date().toISOString()}] Fetching sensor data.`);
      const response = await fetch(`${endpoint}/level?count=1&twelvehour=true`);
      const levels = await response.json();

      console.log(`[${new Date().toISOString()}] Sensor data received:`, levels);

      // Validate the timestamp
      if (isTimestampValid(levels[0].timestamp)) {
        console.log(`[${new Date().toISOString()}] Timestamp is valid.`);
        if (levels[0].inches < 8) {
          console.log(`[${new Date().toISOString()}] Selt level is "high".`);
          iconPath = { 16: "icons/icon-high.png", 48: "icons/icon-high.png", 128: "icons/icon-high.png" };
        } else if (levels[0].inches < 12) {
          console.log(`[${new Date().toISOString()}] Salt level is "medium".`);
          iconPath = { 16: "icons/icon-medium.png", 48: "icons/icon-medium.png", 128: "icons/icon-medium.png" };
        } else {
          console.log(`[${new Date().toISOString()}] Salt level is "low".`);
          iconPath = { 16: "icons/icon-low.png", 48: "icons/icon-low.png", 128: "icons/icon-low.png" };
        }
      } else {
        console.warn(`[${new Date().toISOString()}] Timestamp is invalid or out of date.`);
        iconPath = { 16: "icons/icon-warning.png", 48: "icons/icon-warning.png", 128: "icons/icon-warning.png" };
      }
    }

    // Update the icon
    if (chrome.action) {
      console.log(`[${new Date().toISOString()}] Setting new icon.`);
      chrome.action.setIcon({ path: iconPath });
    } else {
      console.error(`[${new Date().toISOString()}] chrome.action is undefined.`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error during icon update:`, error);
    chrome.action.setIcon({ path: "icons/icon-error.png" }); // Set error icon on fetch failure
  }
}

// Listen for alarm and trigger icon update
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(`[${new Date().toISOString()}] Alarm triggered: ${alarm.name}`);
  if (alarm.name === "updateIcon") {
    updateIcon();
  }
});

// Initial icon update
console.log(`[${new Date().toISOString()}] Performing initial icon update.`);
updateIcon();
