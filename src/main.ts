import "./style.css";

//document.body.innerHTML = ``;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
const lines: { x: number; y: number }[][] = [];
const bus = new EventTarget();
const cursor = { active: false, x: 0, y: 0 };

let currentLine: { x: number; y: number }[] = [];

document.body.appendChild(createDocuElement("h1", "Sketch On Me"));

canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchCanvas";
document.body.appendChild(canvas);

const clearButton = createDocuElement("button", "Clear Drawing");
clearButton.classList.add("clear-button");
document.body.appendChild(clearButton);

bus.addEventListener("drawing-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  lines.push(currentLine);
  currentLine.push({ x: cursor.x, y: cursor.y });
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine.push({ x: cursor.x, y: cursor.y });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = [];
  notify("drawing-changed");
});

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  notify("drawing-changed");
});

function createDocuElement(tag: string, content: string) {
  const element = document.createElement(tag);
  element.textContent = content;
  return element;
}

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const line of lines) {
    if (line.length > 1) {
      ctx.beginPath();
      const { x, y } = line[0];
      ctx.moveTo(x, y);
      for (const { x, y } of line) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
