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
let lineWidth: number = 3;
let cursorSize: number;
let cursorCommand: DrawingCommand | null = null;

document.body.appendChild(createDocuElement("h1", "Sketch On Me"));

canvas.width = 256;
canvas.height = 256;
canvas.style.cursor = "none";
canvas.id = "sketchCanvas";
document.body.appendChild(canvas);

const clearButton = createDocuElement("button", "Clear Drawing", "button");
document.body.appendChild(clearButton);

const undoButton = createDocuElement("button", "Undo", "button");
document.body.appendChild(undoButton);

const redoButton = createDocuElement("button", "Redo", "button");
document.body.appendChild(redoButton);

const thinButton = createDocuElement("button", "Thin", "line-width-button");
document.body.appendChild(thinButton);

const normalButton = createDocuElement("button", "Normal", "line-width-button");
document.body.appendChild(normalButton);

const thickButton = createDocuElement("button", "Thick", "line-width-button");
document.body.appendChild(thickButton);

bus.addEventListener("drawing-changed", () => redraw(ctx));
bus.addEventListener("cursor-changed", () => redraw(ctx));

canvas.addEventListener("mousedown", (e) => {
  lineStack.clear();
  currentLine = createLineCommand([{ x: e.offsetX, y: e.offsetY }], lineWidth);
  lines.push(currentLine);
});

canvas.addEventListener("mousemove", (e) => {
  cursorCommand = createCursorCommand(
    { x: e.offsetX, y: e.offsetY },
    cursorSize,
  );
  notify("cursor-changed");

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
  cursorSize = 30;
});

normalButton.addEventListener("click", () => {
  lineWidth = 3;
  cursorSize = 40;
});

thickButton.addEventListener("click", () => {
  lineWidth = 6;
  cursorSize = 60;
});

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("cursor-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  cursorCommand = createCursorCommand({ x: e.offsetX, y: e.offsetY });
  notify("cursor-changed");
});

function createDocuElement(
  tag: string,
  content: string,
  classList: string = "",
) {
  const element = document.createElement(tag);
  element.textContent = content;
  if (classList !== "") {
    element.classList.add(classList);
  }
  return element;
}

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((cmd) => cmd.display(ctx));

  if (cursorCommand) {
    cursorCommand.display(ctx);
  }
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

function createCursorCommand(
  points: { x: number; y: number },
  cursorSize: number = 40,
): DrawingCommand {
  return {
    points: [points],
    display(ctx) {
      ctx.font = cursorSize + "px monospace";
      if (cursorSize >= 60) {
        ctx.fillText(".", points.x - 16, points.y + 2);
      } else {
        ctx.fillText(".", points.x - 10, points.y + 2);
      }
    },
  };
}
