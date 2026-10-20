// Must match the Arduino sketch
const CONFIG = Object.freeze({
  DEVICE_NAME: "ble-mott",
  SERVICE_UUID: "19b10000-e8f2-537e-4f6c-d104768a1214",
  TEXT_CHAR_UUID: "19b10002-e8f2-537e-4f6c-d104768a1214",
  CLEAR_COMMAND: "borrar",
  MAX_LENGTH: 20,
  SCROLL_MS_PER_COLUMN: 80,
  // Only uppercase letters, digits and space can be sent
  ALLOWED_CHAR: /^[A-ZÑ0-9 ]$/,
});
