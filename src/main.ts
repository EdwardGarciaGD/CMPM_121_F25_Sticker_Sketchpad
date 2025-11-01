import "./style.css";

interface DrawingCommand {
  points: { x: number; y: number }[];
  isSticker: boolean;

  display(ctx: CanvasRenderingContext2D): void;
}

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
const drawings: DrawingCommand[] = [];
const emojis: string[] = ["Create Sticker", "🎮", "🍎", "🍍"];
const bus = new EventTarget();
const undoDrawingStack = createStack<DrawingCommand>();

let drawingCommand: DrawingCommand | null = null;
let lineWidth: number = 3;
let cursorDisplay: string = "o";
let stickerEmoji: string;
let draggingSticker: DrawingCommand | null = null;
let cursorCommand: DrawingCommand | null = null;
let draggedSticker: DrawingCommand | null = null;
let isStickerCursor: boolean = false;

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
  emojis[1],
  "line-width-button",
);
document.body.appendChild(stickerControllerButton);

const stickerAppleButton = createDocuElement(
  "button",
  emojis[2],
  "line-width-button",
);
document.body.appendChild(stickerAppleButton);

const stickerPineappleButton = createDocuElement(
  "button",
  emojis[3],
  "line-width-button",
);
document.body.appendChild(stickerPineappleButton);

const createStickerButton = createDocuElement(
  "button",
  emojis[0],
  "button",
);
document.body.appendChild(createStickerButton);

bus.addEventListener("drawing-changed", () => redraw(ctx));
bus.addEventListener("cursor-changed", () => redraw(ctx));

canvas.addEventListener("mousedown", (e) => {
  undoDrawingStack.clear();
  if (isStickerCursor) {
    if (!draggingSticker) {
      stickerEmoji = cursorDisplay;
      drawingCommand = createStickerCommand(
        { x: e.offsetX, y: e.offsetY },
        stickerEmoji,
      );
    }
  } else {
    drawingCommand = createLineCommand(
      [{ x: e.offsetX, y: e.offsetY }],
      lineWidth,
    );
  }
  if (drawingCommand) drawings.push(drawingCommand);
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  cursorCommand = createCursorCommand(
    { x: e.offsetX, y: e.offsetY },
    cursorDisplay,
  );
  notify("cursor-changed");

  if (e.buttons == 1 && drawingCommand) {
    drawingCommand.points.push({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }

  if (isStickerCursor && !draggedSticker) {
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
  drawingCommand = null;
  draggedSticker = null;
  draggingSticker = null;
  notify("drawing-changed");
});

clearButton.addEventListener("click", () => {
  drawings.splice(0, drawings.length);
  undoDrawingStack.clear();
  notify("drawing-changed");
});

undoButton.addEventListener("click", () => {
  if (drawings.length > 0) {
    undoDrawingStack.push(drawings.pop()!);
    notify("drawing-changed");
  }
});

redoButton.addEventListener("click", () => {
  if (!undoDrawingStack.isEmpty()) {
    drawings.push(undoDrawingStack.pop()!);
    notify("drawing-changed");
  }
});

thinButton.addEventListener("click", () => {
  updateCursor(".", false, 1);
});

normalButton.addEventListener("click", () => {
  updateCursor("o", false, 3);
});

thickButton.addEventListener("click", () => {
  updateCursor("O", false, 6);
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
  updateCursor(emojis[1], true);
});

stickerAppleButton.addEventListener("click", () => {
  updateCursor(emojis[2], true);
});

stickerPineappleButton.addEventListener("click", () => {
  updateCursor(emojis[3], true);
});

createStickerButton.addEventListener("click", () => {
  setUpCustomEmoji();
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
  drawings.forEach((cmd) => cmd.display(ctx));

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
  isSticker: boolean = false,
): DrawingCommand {
  return {
    points,
    isSticker,
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
  isSticker: boolean = false,
): DrawingCommand {
  return {
    points: [points],
    isSticker,
    display(ctx) {
      ctx.font = "40px monospace";
      ctx.fillText(cursorStyle, points.x - 16, points.y + 2);
    },
  };
}

function createStickerCommand(
  sticker: { x: number; y: number },
  cursorStyle: string,
  isSticker: boolean = true,
): DrawingCommand {
  return {
    points: [sticker],
    isSticker,
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
  isSticker: boolean = true,
): DrawingCommand {
  return {
    points: [sticker],
    isSticker,
    display() {
      sticker.x = toX;
      sticker.y = toY;
    },
  };
}

function mouseOnSticker(mouseX: number, mouseY: number) {
  for (const drawing of drawings) {
    if (drawing.isSticker) {
      const dx = mouseX - drawing.points[0].x;
      const dy = mouseY - drawing.points[0].y;
      const d = Math.hypot(dx, dy);
      if (d < 20) return drawing;
    }
  }
  return null;
}

function setUpCustomEmoji() {
  const userInput = prompt("Enter Custom Sticker");

  if (userInput) {
    emojis.push(userInput);
    const customStickerButton = createDocuElement(
      "button",
      userInput,
      "line-width-button",
    );
    document.body.insertBefore(customStickerButton, createStickerButton);

    customStickerButton.addEventListener("click", () => {
      updateCursor(userInput, true);
    });
  }
}

function updateCursor(cursor: string, sticker: boolean, width: number = 2) {
  if (!sticker) lineWidth = width;
  cursorDisplay = cursor;
  isStickerCursor = sticker;
}
