const endpoint = "";

chrome.runtime.onInstalled.addListener(() => {
  console.log(`[${getCST12Hour()}] Extension installed or updated.`);

  // Initial icon set
  if (chrome.action) {
    console.log(`[${getCST12Hour()}] Setting initial icon to "high".`);
    chrome.action.setIcon({ path: "icons/icon-high.png" });
  } else {
    console.error(`[${getCST12Hour()}] chrome.action is undefined.`);
  }

  // Start periodic fetching of sensor data
  console.log(`[${getCST12Hour()}] Creating an alarm for periodic updates.`);
  chrome.alarms.create("updateIcon", { periodInMinutes: 1 });
});

// Function to convert UTC timestamp to CST and validate the range
function isTimestampValid(timestamp) {
  const currentTime = new Date();
  const timestampDate = new Date(timestamp);

  console.log(`[${getCST12Hour()}] Validating timestamp: ${timestamp}`);

  // Convert both dates to CST
  const options = { timeZone: "America/Chicago", hour12: false };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const currentTimeCST = new Date(formatter.format(currentTime));
  const timestampCST = new Date(formatter.format(timestampDate));

  // Calculate the absolute difference in minutes
  const diffInMinutes = Math.abs((currentTimeCST - timestampCST) / (1000 * 60));
  console.log(`[${getCST12Hour()}] Difference in minutes: ${diffInMinutes}`);

  // Return true if the difference is less than 2 minutes
  return diffInMinutes < 2;
}

// Function to check API health
async function checkApiHealth() {
  try {
    console.log(`[${getCST12Hour()}] Checking API health.`);
    const healthResponse = await fetch(`${endpoint}/health`);
    console.log(`[${getCST12Hour()}] API health check status: ${healthResponse.status}`);
    return healthResponse.status === 200;
  } catch (error) {
    console.error(`[${getCST12Hour()}] Error checking API health:`, error);
    return false;
  }
}

// Periodic update of the icon based on data
async function updateIcon() {
  console.clear();
  console.log(`[${getCST12Hour()}] Starting icon update.`);
  try {
    let iconPath;

    // Check API health before fetching data
    const isHealthy = await checkApiHealth();
    if (!isHealthy) {
      console.error(`[${getCST12Hour()}] API is down. Setting error icon.`);
      iconPath = { 16: "icons/icon-error.png", 48: "icons/icon-error.png", 128: "icons/icon-error.png" };
    } else {
      console.log(`[${getCST12Hour()}] Fetching sensor data.`);
      const response = await fetch(`${endpoint}/level?count=1&twelvehour=true`);
      const levels = await response.json();

      console.log(`[${getCST12Hour()}] Sensor data received:`, levels);

      // Validate the timestamp
      if (isTimestampValid(levels[0].timestamp)) {
        console.log(`[${getCST12Hour()}] Timestamp is valid.`);
        if (levels[0].inches < 8) {
          console.log(`[${getCST12Hour()}] Selt level is "high".`);
          iconPath = { 16: "icons/icon-high.png", 48: "icons/icon-high.png", 128: "icons/icon-high.png" };
        } else if (levels[0].inches < 12) {
          console.log(`[${getCST12Hour()}] Salt level is "medium".`);
          iconPath = { 16: "icons/icon-medium.png", 48: "icons/icon-medium.png", 128: "icons/icon-medium.png" };
        } else {
          console.log(`[${getCST12Hour()}] Salt level is "low".`);
          iconPath = { 16: "icons/icon-low.png", 48: "icons/icon-low.png", 128: "icons/icon-low.png" };
        }
      } else {
        console.warn(`[${getCST12Hour()}] Timestamp is invalid or out of date.`);
        iconPath = { 16: "icons/icon-warning.png", 48: "icons/icon-warning.png", 128: "icons/icon-warning.png" };
      }
    }

    // Update the icon
    if (chrome.action) {
      console.log(`[${getCST12Hour()}] Setting new icon.`);
      chrome.action.setIcon({ path: iconPath });
    } else {
      console.error(`[${getCST12Hour()}] chrome.action is undefined.`);
    }
  } catch (error) {
    console.error(`[${getCST12Hour()}] Error during icon update:`, error);
    chrome.action.setIcon({ path: "icons/icon-error.png" }); // Set error icon on fetch failure
  }
}

function getCST12Hour() {
  // Get the current date in ISO format (UTC)
  const isoString = new Date().toISOString();

  // Convert it to a Date object
  const date = new Date(isoString);

  // Format it into CST (Central Standard Time) in 12-hour format
  const options = {
      timeZone: 'America/Chicago', // CST
      hour12: true, // 12-hour format
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const formattedDate = formatter.format(date);

  return formattedDate; // Example: "Dec 07, 2024, 03:15:45 PM"
}

// Listen for alarm and trigger icon update
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(`[${getCST12Hour()}] Alarm triggered: ${alarm.name}`);
  if (alarm.name === "updateIcon") {
    updateIcon();
  }
});

// Initial icon update
console.log(`[${getCST12Hour()}] Performing initial icon update.`);
updateIcon();
