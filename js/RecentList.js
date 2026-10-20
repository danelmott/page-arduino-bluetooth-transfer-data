// Recently sent texts, stored in localStorage
class RecentList {
  static STORAGE_KEY = "recent";
  static MAX_ITEMS = 8;

  #card;
  #list;
  #items;

  constructor(card, list, onSelect) {
    this.#card = card;
    this.#list = list;
    this.#items = this.#load();
    list.addEventListener("click", (event) => {
      const text = event.target.closest(".chip")?.dataset.text;
      if (text) onSelect(text);
    });
    this.#render();
  }

  add(text) {
    this.#items = [text, ...this.#items.filter((item) => item !== text)].slice(0, RecentList.MAX_ITEMS);
    try {
      localStorage.setItem(RecentList.STORAGE_KEY, JSON.stringify(this.#items));
    } catch {}
    this.#render();
  }

  #load() {
    try {
      const items = JSON.parse(localStorage.getItem(RecentList.STORAGE_KEY)) ?? [];
      return items.filter((item) => typeof item === "string" && item);
    } catch {
      return [];
    }
  }

  #render() {
    this.#card.hidden = this.#items.length === 0;
    this.#list.replaceChildren(...this.#items.map((text) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.textContent = text;
      chip.dataset.text = text;
      return chip;
    }));
  }
}
