import "./style.css";

//document.body.innerHTML = ``;

interface DrawingCommand {
  points: { x: number; y: number }[];

  display(ctx: CanvasRenderingContext2D): void;
}

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
const lines: DrawingCommand[] = [];
const bus = new EventTarget();
const lineStack = createStack<DrawingCommand>();

let currentLine: DrawingCommand | null = null;
let lineWidth = 3;

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

const thinButton = createDocuElement("button", "Thin");
thinButton.classList.add("line-width-button");
document.body.appendChild(thinButton);

const thickButton = createDocuElement("button", "Thick");
thickButton.classList.add("line-width-button");
document.body.appendChild(thickButton);

bus.addEventListener("drawing-changed", () => redraw(ctx));

canvas.addEventListener("mousedown", (e) => {
  lineStack.clear();
  currentLine = createLineCommand([{ x: e.offsetX, y: e.offsetY }], lineWidth);
  lines.push(currentLine);
});

canvas.addEventListener("mousemove", (e) => {
  if (e.buttons == 1 && currentLine) {
    currentLine.points.push({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  currentLine = null;
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

thinButton.addEventListener("click", () => {
  lineWidth = 1;
});

thickButton.addEventListener("click", () => {
  lineWidth = 6;
});

function createLineCommand(
  points: { x: number; y: number }[],
  width: number,
): DrawingCommand {
  return {
    points,
    display(ctx) {
      ctx.save();
      ctx.strokeStyle = "black";
      ctx.lineWidth = width;
      ctx.beginPath();
      const { x, y } = points[0];
      ctx.moveTo(x, y);
      for (const { x, y } of points) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    },
  };
}

function createDocuElement(tag: string, content: string) {
  const element = document.createElement(tag);
  element.textContent = content;
  return element;
}

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((cmd) => cmd.display(ctx));
}

function createStack<drawingCommand>() {
  const redoLines: drawingCommand[] = [];

  return {
    push: (command: drawingCommand) => {
      redoLines.push(command);
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
