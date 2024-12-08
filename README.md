# WS Sesnor Extension

The **WS Sesnor** Chrome extension monitors sensor levels and updates the extension icon in real-time based on API data. The icon reflects different statuses (high, medium, low, or error) based on the sensor levels retrieved from the connected API.

## Features

- **Real-time Icon Updates**: Periodically fetches sensor data and updates the extension icon with the status of the salt level.
  - *High* if salt level is below 8 inches.
  - *Medium* if salt level is between 8 and 12 inches.
  - *Low* if salt level is above 12 inches.
  - *Error* if the API is down or there's a fetch issue.
- **API Health Monitoring**: The extension checks the health of the connected API before fetching data.
- **Timestamp Validation**: Ensures the sensor data is fresh (within the last 2 minutes).
- **Periodic Refresh**: The extension fetches data and updates the icon every minute.

## Credits

- Icons by [Icon8](https://icons8.com) is licensed under [Creative Commons BY 3.0](https://creativecommons.org/licenses/by/3.0/).
