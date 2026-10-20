// Timestamped activity log, newest first
class ActivityLog {
  #list;

  constructor(list) {
    this.#list = list;
  }

  add(message) {
    const item = document.createElement("li");
    const time = document.createElement("span");
    time.className = "activity__time";
    time.textContent = new Date().toLocaleTimeString();
    item.append(time, message);
    this.#list.prepend(item);
  }
}
