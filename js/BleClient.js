// Web Bluetooth connection to the Arduino
class BleClient {
  #device = null;
  #characteristic = null;
  #busy = false;
  #onStatusChange;
  #onLog;

  constructor({ onStatusChange, onLog }) {
    this.#onStatusChange = onStatusChange;
    this.#onLog = onLog;
  }

  static get isSupported() {
    return "bluetooth" in navigator;
  }

  get isConnected() {
    return !!this.#device?.gatt.connected;
  }

  get deviceName() {
    return this.#device?.name ?? CONFIG.DEVICE_NAME;
  }

  async connect() {
    try {
      this.#onStatusChange("connecting");
      this.#device = await navigator.bluetooth.requestDevice({
        filters: [{ name: CONFIG.DEVICE_NAME }],
        optionalServices: [CONFIG.SERVICE_UUID],
      });
      this.#device.addEventListener("gattserverdisconnected", () => this.#handleDisconnect());

      const server = await this.#device.gatt.connect();
      const service = await server.getPrimaryService(CONFIG.SERVICE_UUID);
      this.#characteristic = await service.getCharacteristic(CONFIG.TEXT_CHAR_UUID);

      this.#onStatusChange("connected");
      this.#onLog("Conectado");
    } catch (err) {
      this.#onStatusChange("disconnected");
      this.#onLog(err.name === "NotFoundError" ? "Conexión cancelada" : "Error: " + err.message);
    }
  }

  disconnect() {
    if (this.isConnected) this.#device.gatt.disconnect();
  }

  async send(text) {
    if (!this.#characteristic || this.#busy) return false;
    this.#busy = true;
    try {
      await this.#characteristic.writeValue(new TextEncoder().encode(text));
      this.#onLog("Enviado: " + text);
      return true;
    } catch (err) {
      this.#onLog("Error al enviar: " + err.message);
      return false;
    } finally {
      this.#busy = false;
    }
  }

  #handleDisconnect() {
    this.#characteristic = null;
    this.#onStatusChange("disconnected");
    this.#onLog("Desconectado");
  }
}
