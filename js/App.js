// Wires the UI components together and holds the text being composed
class App {
  static STATUS_TEXT = {
    connected: { label: "Conectado", detail: null },
    connecting: { label: "Conectando...", detail: "Elige el dispositivo en la ventana" },
    disconnected: { label: "Desconectado", detail: "Toca conectar para buscar el Arduino" },
  };

  static LED_TEXT = {
    red: "En espera",
    green: "Mostrando",
    off: "Sin conexión",
  };

  #text = "";
  #ledTimer = null;
  #el;
  #ble;
  #matrix;
  #recent;
  #log;

  constructor() {
    const byId = (id) => document.getElementById(id);
    this.#el = {
      unsupportedAlert: byId("unsupportedAlert"),
      statusDot: byId("statusDot"),
      statusLabel: byId("statusLabel"),
      statusDetail: byId("statusDetail"),
      connectButton: byId("connectButton"),
      counter: byId("counter"),
      led: byId("led"),
      ledLabel: byId("ledLabel"),
      sendButton: byId("sendButton"),
      clearMatrixButton: byId("clearMatrixButton"),
    };

    this.#log = new ActivityLog(byId("activityList"));
    this.#matrix = new LedMatrix(byId("matrix"));
    this.#recent = new RecentList(byId("recentCard"), byId("recentList"), (text) => this.#setText(text));
    this.#ble = new BleClient({
      onStatusChange: (status) => this.#setStatus(status),
      onLog: (message) => this.#log.add(message),
    });
    new Keyboard(byId("keyboard"), (key) => this.#handleKey(key));

    this.#bindEvents();
  }

  start() {
    this.#el.unsupportedAlert.hidden = BleClient.isSupported;
    this.#setText("");
    this.#setStatus("disconnected");
  }

  #bindEvents() {
    this.#el.connectButton.addEventListener("click", () => {
      this.#ble.isConnected ? this.#ble.disconnect() : this.#ble.connect();
    });
    this.#el.sendButton.addEventListener("click", () => this.#send());
    this.#el.clearMatrixButton.addEventListener("click", () => this.#clearMatrix());
    document.addEventListener("keydown", (event) => this.#handlePhysicalKey(event));
  }

  // ---------- Text ----------
  static sanitize(text) {
    return [...text.toUpperCase()]
      .filter((char) => CONFIG.ALLOWED_CHAR.test(char))
      .join("")
      .slice(0, CONFIG.MAX_LENGTH);
  }

  #setText(text) {
    this.#text = App.sanitize(text);
    this.#el.counter.textContent = `${this.#text.length}/${CONFIG.MAX_LENGTH}`;
    this.#el.counter.classList.toggle("display__counter--full", this.#text.length >= CONFIG.MAX_LENGTH);
    this.#matrix.show(this.#text);
  }

  #handleKey(key) {
    switch (key) {
      case Keyboard.BACKSPACE: return this.#setText(this.#text.slice(0, -1));
      case Keyboard.CLEAR: return this.#setText("");
      case Keyboard.SPACE: return this.#setText(this.#text + " ");
      default: return this.#setText(this.#text + key);
    }
  }

  #handlePhysicalKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const isButton = event.target.tagName === "BUTTON";

    if (event.key === "Enter") {
      // A focused button already reacts to Enter; don't send twice
      if (!isButton) this.#send();
    } else if (event.key === "Backspace") {
      this.#handleKey(Keyboard.BACKSPACE);
    } else if (event.key === "Escape") {
      this.#handleKey(Keyboard.CLEAR);
    } else if (event.key.length === 1 && CONFIG.ALLOWED_CHAR.test(event.key.toUpperCase())) {
      event.preventDefault(); // stops space from "clicking" the focused button
      this.#setText(this.#text + event.key);
    }
  }

  // ---------- Bluetooth actions ----------
  async #send() {
    const text = this.#text.trim();
    this.#setText(text);
    if (!text) return;

    if (!(await this.#ble.send(text))) return;

    this.#recent.add(text);
    this.#setLed("green");
    clearTimeout(this.#ledTimer);
    // The Arduino goes back to red once long text has finished scrolling
    if (text.length > 3) {
      const ms = (text.length + 4) * 5 * CONFIG.SCROLL_MS_PER_COLUMN;
      this.#ledTimer = setTimeout(() => this.#ble.isConnected && this.#setLed("red"), ms);
    }
  }

  async #clearMatrix() {
    if (!(await this.#ble.send(CONFIG.CLEAR_COMMAND))) return;
    clearTimeout(this.#ledTimer);
    this.#setText("");
    this.#setLed("red");
  }

  // ---------- Status ----------
  #setStatus(status) {
    const { label, detail } = App.STATUS_TEXT[status];
    const isConnected = status === "connected";

    this.#el.statusDot.className = "status-dot" + (status === "disconnected" ? "" : ` status-dot--${status}`);
    this.#el.statusLabel.textContent = label;
    this.#el.statusDetail.textContent = detail ?? this.#ble.deviceName;

    this.#el.connectButton.textContent = isConnected ? "Desconectar" : "Conectar";
    this.#el.connectButton.classList.toggle("btn--primary", !isConnected);
    this.#el.connectButton.classList.toggle("btn--secondary", isConnected);
    this.#el.connectButton.disabled = status === "connecting" || !BleClient.isSupported;

    this.#el.sendButton.disabled = !isConnected;
    this.#el.clearMatrixButton.disabled = !isConnected;
    this.#setLed(isConnected ? "red" : "off");
  }

  #setLed(color) {
    this.#el.led.className = `led led--${color}`;
    this.#el.ledLabel.textContent = App.LED_TEXT[color];
  }
}
