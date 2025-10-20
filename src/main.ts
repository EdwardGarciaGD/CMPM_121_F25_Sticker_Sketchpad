import "./style.css";

interface DrawingCommand {
  points: { x: number; y: number }[];

  display(ctx: CanvasRenderingContext2D): void;
}

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
const lines: DrawingCommand[] = [];
const stickers: DrawingCommand[] = [];
const bus = new EventTarget();
const lineStack = createStack<DrawingCommand>();

let currentLine: DrawingCommand | null = null;
let lineWidth: number = 3;
let stickerEmoji: string = ".";
let draggingSticker: DrawingCommand | null = null;
let cursorCommand: DrawingCommand | null = null;
let stickerCommand: DrawingCommand | null = null;
let draggedSticker: DrawingCommand | null = null;
let isSticker: boolean = false;

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

const divider = document.createElement("div");
document.body.appendChild(divider);

const stickerControllerButton = createDocuElement(
  "button",
  "🎮",
  "line-width-button",
);
document.body.appendChild(stickerControllerButton);

const stickerAppleButton = createDocuElement(
  "button",
  "🍎",
  "line-width-button",
);
document.body.appendChild(stickerAppleButton);

const stickerPineappleButton = createDocuElement(
  "button",
  "🍍",
  "line-width-button",
);
document.body.appendChild(stickerPineappleButton);

bus.addEventListener("drawing-changed", () => redraw(ctx));
bus.addEventListener("cursor-changed", () => redraw(ctx));

canvas.addEventListener("mousedown", (e) => {
  lineStack.clear();
  if (isSticker) {
    if (!draggingSticker) {
      stickerCommand = createStickerCommand(
        { x: e.offsetX, y: e.offsetY },
        stickerEmoji,
      );
      stickers.push(stickerCommand);
    }
  } else {
    currentLine = createLineCommand(
      [{ x: e.offsetX, y: e.offsetY }],
      lineWidth,
    );
    lines.push(currentLine);
  }
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  cursorCommand = createCursorCommand(
    { x: e.offsetX, y: e.offsetY },
    stickerEmoji,
  );
  notify("cursor-changed");

  if (e.buttons == 1 && currentLine) {
    currentLine.points.push({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }

  if (isSticker && !draggedSticker) {
    draggingSticker = mouseOnSticker(e.offsetX, e.offsetY);
  }
  if (draggingSticker && e.buttons == 1) {
    draggedSticker = moveStickerCommand(
      draggingSticker.points[0],
      e.offsetX,
      e.offsetY,
    );
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  currentLine = null;
  stickerCommand = null;
  draggedSticker = null;
  draggingSticker = null;
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
  stickerEmoji = ".";
  isSticker = false;
});

normalButton.addEventListener("click", () => {
  lineWidth = 3;
  stickerEmoji = "o";
  isSticker = false;
});

thickButton.addEventListener("click", () => {
  lineWidth = 6;
  stickerEmoji = "O";
  isSticker = false;
});

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  draggedSticker = null;
  notify("cursor-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  cursorCommand = createCursorCommand({ x: e.offsetX, y: e.offsetY });
  notify("cursor-changed");
});

stickerControllerButton.addEventListener("click", () => {
  stickerEmoji = "🎮";
  isSticker = true;
});

stickerAppleButton.addEventListener("click", () => {
  stickerEmoji = "🍎";
  isSticker = true;
});

stickerPineappleButton.addEventListener("click", () => {
  stickerEmoji = "🍍";
  isSticker = true;
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
  stickers.forEach((cmd) => cmd.display(ctx));

  if (stickerCommand) {
    stickerCommand.display(ctx);
  }

  if (draggedSticker) {
    draggedSticker.display(ctx);
  }

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
  cursorStyle: string = ".",
): DrawingCommand {
  return {
    points: [points],
    display(ctx) {
      ctx.font = "40px monospace";
      ctx.fillText(cursorStyle, points.x - 16, points.y + 2);
    },
  };
}

function createStickerCommand(
  sticker: { x: number; y: number },
  cursorStyle: string,
): DrawingCommand {
  return {
    points: [sticker],
    display(ctx) {
      ctx.save();
      ctx.fillText(cursorStyle, sticker.x - 11, sticker.y + 2);
      ctx.lineWidth = 40;
      ctx.restore();
    },
  };
}

function moveStickerCommand(
  sticker: { x: number; y: number },
  toX: number,
  toY: number,
): DrawingCommand {
  return {
    points: [sticker],
    display() {
      sticker.x = toX;
      sticker.y = toY;
    },
  };
}

function mouseOnSticker(mouseX: number, mouseY: number) {
  for (const sticker of stickers) {
    const dx = mouseX - sticker.points[0].x;
    const dy = mouseY - sticker.points[0].y;
    const d = Math.hypot(dx, dy);
    if (d < 20) {
      return sticker;
    }
  }
  return null;
}
