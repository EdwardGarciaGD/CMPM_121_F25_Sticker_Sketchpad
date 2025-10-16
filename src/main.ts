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

const ctx = canvas.getContext("2d");

// Testing canvas
if (ctx) {
  ctx.fillStyle = "#85f4eeff";
  ctx.beginPath();
  ctx.arc(128, 128, 64, 0, Math.PI * 2);
  ctx.fill();
}
