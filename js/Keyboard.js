// On-screen keyboard: digits, letters, space, backspace and clear
class Keyboard {
  static BACKSPACE = "backspace";
  static SPACE = "space";
  static CLEAR = "clear";

  static LAYOUT = [
    ..."1234567890",
    ..."QWERTYUIOP",
    ..."ASDFGHJKLÑ",
    ..."ZXCVBNM", Keyboard.BACKSPACE,
    Keyboard.SPACE, Keyboard.CLEAR,
  ];

  static SPECIAL_KEYS = {
    [Keyboard.BACKSPACE]: { label: "⌫", className: "key--wide", ariaLabel: "Borrar letra" },
    [Keyboard.SPACE]: { label: "espacio", className: "key--space" },
    [Keyboard.CLEAR]: { label: "Limpiar", className: "key--wide" },
  };

  constructor(container, onKey) {
    this.#render(container);
    container.addEventListener("click", (event) => {
      const key = event.target.closest(".key")?.dataset.key;
      if (key) onKey(key);
    });
  }

  #render(container) {
    container.replaceChildren(...Keyboard.LAYOUT.map((key) => {
      const button = document.createElement("button");
      const special = Keyboard.SPECIAL_KEYS[key];
      button.className = "key";
      button.dataset.key = key;
      button.textContent = special?.label ?? key;
      if (special) button.classList.add(special.className);
      if (special?.ariaLabel) button.setAttribute("aria-label", special.ariaLabel);
      return button;
    }));
  }
}
