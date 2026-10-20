// LED matrix preview drawn on a <canvas>.
// Text that fits is centered; longer text scrolls like on the Arduino.
class LedMatrix {
  static ROWS = 7;
  static COLS = 32;
  static GAP_COLUMNS = 8; // blank columns between scroll loops
  static COLOR_ON = "#ef4444";
  static COLOR_OFF = "#1f0d0d";

  #canvas;
  #ctx;
  #columns = [];
  #offset = 0;
  #timer = null;

  constructor(canvas) {
    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d");
    new ResizeObserver(() => this.#resize()).observe(canvas);
  }

  show(text) {
    const previousLength = this.#columns.length;
    this.#columns = DotFont.toColumns(text);

    if (this.#scrolls && !this.#timer) {
      this.#offset = 0;
      this.#timer = setInterval(() => {
        this.#offset++;
        this.#draw();
      }, CONFIG.SCROLL_MS_PER_COLUMN);
    } else if (!this.#scrolls && this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    if (this.#columns.length < previousLength) this.#offset = 0;
    this.#draw();
  }

  get #scrolls() {
    return this.#columns.length > LedMatrix.COLS;
  }

  #resize() {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = this.#canvas.getBoundingClientRect();
    this.#canvas.width = Math.round(width * dpr);
    this.#canvas.height = Math.round(height * dpr);
    this.#draw();
  }

  // Column visible at position x of the matrix
  #columnAt(x) {
    if (!this.#scrolls) {
      const start = Math.floor((LedMatrix.COLS - this.#columns.length) / 2);
      return this.#columns[x - start] ?? 0;
    }
    const loopLength = this.#columns.length + LedMatrix.GAP_COLUMNS;
    return this.#columns[(this.#offset + x) % loopLength] ?? 0;
  }

  #draw() {
    const ctx = this.#ctx;
    const { width, height } = this.#canvas;
    if (!width) return;

    const step = width / LedMatrix.COLS;
    const radius = step * 0.36;
    ctx.clearRect(0, 0, width, height);

    for (let x = 0; x < LedMatrix.COLS; x++) {
      const column = this.#columnAt(x);
      for (let y = 0; y < LedMatrix.ROWS; y++) {
        const isOn = (column >> y) & 1;
        ctx.fillStyle = isOn ? LedMatrix.COLOR_ON : LedMatrix.COLOR_OFF;
        ctx.beginPath();
        ctx.arc(x * step + step / 2, y * step + step / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
