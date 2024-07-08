// Canvas 2D renderer for object "Flower"

const d2r = Math.PI / 180, noDash = [];

function resetTransform(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export default function draw(ctx, setRootTransform = resetTransform) {
    // Transform root
    setRootTransform(ctx);
    // Draw "Stem"
    ctx.strokeStyle = "#18F900";
    ctx.lineWidth = 8;
    ctx.setLineDash(noDash);
    ctx.lineJoin = "miter";
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-8.13, -73.47, 56, -136, 56, -136);
    ctx.stroke();

    // Transform root
    setRootTransform(ctx);
    // Transform "Leaves"
    ctx.translate(32, -128);
    // Draw "Leaves"
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(-24, 8);
    ctx.bezierCurveTo(-104.51, -4.54, -75.65, -80.51, -8, -32);
    ctx.bezierCurveTo(-31.1, -89.22, 67.01, -87.36, 43.52, -22.46);
    ctx.bezierCurveTo(102.34, -66.36, 124.28, 17.03, 70.14, 15.94);
    ctx.bezierCurveTo(129.4, 61.06, 73.34, 80.83, 43.52, 44.61);
    ctx.bezierCurveTo(38.91, 111.68, -9.09, 98.24, -4.61, 37.95);
    ctx.bezierCurveTo(-66.95, 73.15, -74.82, 20.03, -24, 8);
    ctx.closePath();
    ctx.fill();

    // Transform "Center"
    ctx.translate(16, 4.1);
    ctx.scale(1.11, 1.09);
    // Draw "Center"
    ctx.fillStyle = "#FFD11A";
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 32, 0, 0, 360 * d2r);
    ctx.fill();

}
