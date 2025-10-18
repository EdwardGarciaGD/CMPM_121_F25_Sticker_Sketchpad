import "./style.css";

//document.body.innerHTML = ``;

interface Point {
  x: number;
  y: number;
}

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
const lines: Point[][] = [];
const bus = new EventTarget();
const cursor = { active: false, x: 0, y: 0 };
const lineStack = createStack<Point>();

let currentLine: Point[] = [];

document.body.appendChild(createDocuElement("h1", "Sketch On Me"));

canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchCanvas";
document.body.appendChild(canvas);

const clearButton = createDocuElement("button", "Clear Drawing");
clearButton.classList.add("button");
document.body.appendChild(clearButton);

const undoButton = createDocuElement("button", "Undo");
undoButton.classList.add("button");
document.body.appendChild(undoButton);

const redoButton = createDocuElement("button", "Redo");
redoButton.classList.add("button");
document.body.appendChild(redoButton);

bus.addEventListener("drawing-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  lineStack.clear();
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
  lineStack.clear();
  notify("drawing-changed");
});

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    lineStack.push(lines.pop()!);
    notify("drawing-changed");
  }
});

redoButton.addEventListener("click", () => {
  if (!lineStack.isEmpty()) {
    lines.push(lineStack.pop()!);
    notify("drawing-changed");
  }
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

function createStack<Point>() {
  const redoLines: Point[][] = [];

  return {
    push: (line: Point[]) => {
      redoLines.push(line);
    },
    pop: () => redoLines.pop(),
    peek: () => redoLines[redoLines.length - 1],
    isEmpty: () => redoLines.length === 0,
    size: () => redoLines.length,
    clear: () => {
      redoLines.length = 0;
    },
  };
}
