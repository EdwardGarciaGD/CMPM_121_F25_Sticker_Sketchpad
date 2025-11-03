import "./style.css";

interface DrawingCommand {
  points: { x: number; y: number }[];
  isSticker: boolean;

  display(ctx: CanvasRenderingContext2D): void;
}

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
const drawings: DrawingCommand[] = [];
const emojis: string[] = [
  "Create Sticker",
  "🎮",
  "🍎",
  "🍍",
  "Export Drawing",
  ".🖊",
  "•🖊",
  "⏺🖊",
];
const bus = new EventTarget();
const undoDrawingStack = createStack<DrawingCommand>();
const canvasHeight: number = 256;
const canvasWidth: number = 256;

let drawingCommand: DrawingCommand | null = null;
let grabbedSticker: DrawingCommand | null = null;
let cursorCommand: DrawingCommand | null = null;
let draggingSticker: DrawingCommand | null = null;
let lineWidth: number = 3;
let cursorDisplay: string = emojis[6];
let stickerEmoji: string;
let isStickerCursor: boolean = false;
let isConfirmed: boolean = false;

document.body.appendChild(
  createDocuElement("h1", "Sketch On Me", "center-container"),
);

canvas.width = canvasWidth;
canvas.height = canvasHeight;
canvas.style.cursor = "none";
document.body.appendChild(canvas);

const clearButton = createDocuElement("button", "Clear Drawing", "button");
document.body.appendChild(clearButton);

const undoButton = createDocuElement("button", "Undo", "button");
document.body.appendChild(undoButton);

const redoButton = createDocuElement("button", "Redo", "button");
document.body.appendChild(redoButton);

const thinButton = createDocuElement("button", "Thin .", "line-width-button");
document.body.appendChild(thinButton);

const normalButton = createDocuElement(
  "button",
  "Normal •",
  "line-width-button",
);
document.body.appendChild(normalButton);

const thickButton = createDocuElement("button", "Thick ⏺", "line-width-button");
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

const exportCanvasButton = createDocuElement(
  "button",
  emojis[4],
  "button",
);
document.body.appendChild(exportCanvasButton);

bus.addEventListener("drawing-changed", () => redraw(ctx));
bus.addEventListener("cursor-changed", () => redraw(ctx));

canvas.addEventListener("mousedown", (e) => {
  undoDrawingStack.clear();
  if (isStickerCursor) {
    if (!grabbedSticker) {
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
    isStickerCursor,
  );

  if (e.buttons == 1 && drawingCommand) {
    drawingCommand.points.push({ x: e.offsetX, y: e.offsetY });
  }
  if (isStickerCursor && !draggingSticker) {
    grabbedSticker = mouseOnSticker(e.offsetX, e.offsetY);
  }
  if (grabbedSticker && e.buttons == 1) {
    draggingSticker = moveStickerCommand(
      grabbedSticker.points[0],
      e.offsetX,
      e.offsetY,
    );
    notify("drawing-changed");
  }
  notify("cursor-changed");
});

canvas.addEventListener("mouseup", () => {
  drawingCommand = null;
  draggingSticker = null;
  grabbedSticker = null;
  notify("drawing-changed");
});

clearButton.addEventListener("click", () => {
  isConfirmed = confirm("Clear canvas drawing?");
  if (isConfirmed) {
    drawings.splice(0, drawings.length);
    undoDrawingStack.clear();
    notify("drawing-changed");
    isConfirmed = false;
  }
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
  updateCursor(emojis[5], false, 1);
});

normalButton.addEventListener("click", () => {
  updateCursor(emojis[6], false, 3);
});

thickButton.addEventListener("click", () => {
  updateCursor(emojis[7], false, 6);
});

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  draggingSticker = null;
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

createStickerButton.addEventListener("click", setUpCustomEmoji);

exportCanvasButton.addEventListener("click", exportCanvas);

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

  if (draggingSticker) {
    draggingSticker.display(ctx);
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
  cursorStyle: string = emojis[6],
  isSticker: boolean = false,
): DrawingCommand {
  return {
    points: [points],
    isSticker,
    display(ctx) {
      if (!isSticker) ctx.font = "18px monospace";
      ctx.fillText(cursorStyle, points.x - 4, points.y + 2);
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
      ctx.fillText(cursorStyle, sticker.x - 4, sticker.y + 2);
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
      if (d < 8) return drawing;
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

function exportCanvas() {
  isConfirmed = confirm("Download drawing?");
  if (isConfirmed) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasWidth * 4;
    tempCanvas.height = canvasHeight * 4;

    const tempCTX = tempCanvas.getContext("2d")!;
    tempCTX.scale(4, 4);

    tempCTX.fillStyle = "#EAE0CE";
    tempCTX.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    drawings.forEach((cmd) => cmd.display(tempCTX));

    const link = document.createElement("a");
    link.href = tempCanvas.toDataURL("image/png");
    link.download = "sketchpad.png";
    link.click();
  }
}
