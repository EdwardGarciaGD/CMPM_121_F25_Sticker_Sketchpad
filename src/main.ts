import "./style.css";

//document.body.innerHTML = ``;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
const cursor = { active: false, x: 0, y: 0 };

document.body.appendChild(createDocuElement("h1", "Sketch On Me"));

canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchCanvas";
document.body.appendChild(canvas);

const clearButton = createDocuElement("button", "Clear Drawing");
clearButton.classList.add("clear-button");
document.body.appendChild(clearButton);

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function createDocuElement(tag: string, content: string) {
  const element = document.createElement(tag);
  element.textContent = content;
  return element;
}
