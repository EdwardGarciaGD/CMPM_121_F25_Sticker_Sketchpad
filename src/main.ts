import "./style.css";

//document.body.innerHTML = ``;

const heading = document.createElement("h1");
heading.textContent = "Sketch On Me";
document.body.appendChild(heading);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchCanvas";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;

let currentLine: { x: number; y: number }[] | null = null;
const lines: { x: number; y: number }[][] = [];

const bus = new EventTarget();
bus.addEventListener("drawing-changed", redraw);

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

const cursor = { active: false, x: 0, y: 0 };
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  currentLine.push({ x: cursor.x, y: cursor.y });
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    currentLine?.push({ x: cursor.x, y: cursor.y });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;

  notify("drawing-changed");
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  notify("drawing-changed");
});

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
