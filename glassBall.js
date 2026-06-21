(function () {
    'use strict';

    const REFRACTION_RATIO_WEAK = 0.95;
    const REFRACTION_RATIO_STRONG = 0.78;
    const BUBBLE_COLORS = [
        [255, 72, 92],   // red
        [255, 154, 46],  // orange
        [255, 220, 64],  // yellow
        [68, 214, 118],  // green
        [54, 190, 255],  // blue
        [105, 105, 255], // indigo
        [213, 82, 255],  // violet
    ];

    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d');
    const sphereCanvas = document.createElement('canvas');
    const sphereCtx = sphereCanvas.getContext('2d');

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function clamp01(value) {
        return clamp(value, 0, 1);
    }

    function smoothstep(edge0, edge1, value) {
        const t = clamp01((value - edge0) / (edge1 - edge0));
        return t * t * (3 - 2 * t);
    }

    function ensureCanvas(canvas, width, height) {
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
    }

    function sampleChannel(data, size, x, y, channel) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = Math.min(size - 1, x0 + 1);
        const y1 = Math.min(size - 1, y0 + 1);
        const tx = x - x0;
        const ty = y - y0;
        const i00 = (y0 * size + x0) * 4 + channel;
        const i10 = (y0 * size + x1) * 4 + channel;
        const i01 = (y1 * size + x0) * 4 + channel;
        const i11 = (y1 * size + x1) * 4 + channel;
        const top = data[i00] * (1 - tx) + data[i10] * tx;
        const bottom = data[i01] * (1 - tx) + data[i11] * tx;
        return top * (1 - ty) + bottom * ty;
    }

    function getRefractedPoint(nx, ny, edge, sourceCenter, radius, ratio, spin, driftX, driftY) {
        const ratioStrength = (1 - ratio) * 4.2;
        const inversion = 0.48 + ratioStrength + edge * (0.42 + ratioStrength * 0.55);
        const compression = 0.18 + (1 - edge) * 0.16;
        const twistX = -ny * spin * radius * edge;
        const twistY = nx * spin * radius * edge;

        return {
            x: sourceCenter - nx * radius * inversion + nx * radius * compression + twistX + driftX,
            y: sourceCenter - ny * radius * inversion + ny * radius * compression + twistY + driftY,
        };
    }

    function drawRefractedBackground(ctx, x, y, radius, distortion, rainbow) {
        const canvas = ctx.canvas;
        const renderSize = Math.min(128, Math.max(24, Math.ceil(radius * 2)));
        const sampleSize = Math.max(24, Math.ceil(radius * 3.05));
        const sampleX = clamp(Math.round(x - sampleSize / 2), 0, Math.max(0, canvas.width - sampleSize));
        const sampleY = clamp(Math.round(y - sampleSize / 2), 0, Math.max(0, canvas.height - sampleSize));

        ensureCanvas(sourceCanvas, sampleSize, sampleSize);
        ensureCanvas(sphereCanvas, renderSize, renderSize);

        sourceCtx.clearRect(0, 0, sampleSize, sampleSize);
        sourceCtx.drawImage(canvas, sampleX, sampleY, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);

        const source = sourceCtx.getImageData(0, 0, sampleSize, sampleSize).data;
        const output = sphereCtx.createImageData(renderSize, renderSize);
        const out = output.data;
        const sourceCenter = sampleSize / 2;
        const renderCenter = renderSize / 2;
        const renderRadius = renderSize / 2;
        const spin = Math.sin(distortion) * 0.055;
        const driftX = Math.cos(distortion * 0.7) * radius * 0.035;
        const driftY = Math.sin(distortion * 0.9) * radius * 0.03;

        for (let py = 0; py < renderSize; py++) {
            for (let px = 0; px < renderSize; px++) {
                const nx = (px + 0.5 - renderCenter) / renderRadius;
                const ny = (py + 0.5 - renderCenter) / renderRadius;
                const distance2 = nx * nx + ny * ny;
                const index = (py * renderSize + px) * 4;

                if (distance2 > 1) {
                    out[index + 3] = 0;
                    continue;
                }

                const edge = Math.sqrt(distance2);
                const blend = smoothstep(0.12, 0.96, edge);
                const weak = getRefractedPoint(nx, ny, edge, sourceCenter, radius, REFRACTION_RATIO_WEAK, spin, driftX, driftY);
                const strong = getRefractedPoint(nx, ny, edge, sourceCenter, radius, REFRACTION_RATIO_STRONG, spin, driftX, driftY);
                const sx = clamp(weak.x * (1 - blend) + strong.x * blend, 0, sampleSize - 1);
                const sy = clamp(weak.y * (1 - blend) + strong.y * blend, 0, sampleSize - 1);
                const dispersion = rainbow * edge * radius * 0.065;
                const dx = nx * dispersion;
                const dy = ny * dispersion;

                out[index] = sampleChannel(source, sampleSize, clamp(sx + dx, 0, sampleSize - 1), clamp(sy + dy, 0, sampleSize - 1), 0);
                out[index + 1] = sampleChannel(source, sampleSize, sx, sy, 1);
                out[index + 2] = sampleChannel(source, sampleSize, clamp(sx - dx, 0, sampleSize - 1), clamp(sy - dy, 0, sampleSize - 1), 2);
                out[index + 3] = 96 + edge * 72;
            }
        }

        sphereCtx.putImageData(output, 0, 0);

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(sphereCanvas, x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore();
    }

    function drawRainbowTint(ctx, x, y, radius, intensity, distortion) {
        if (intensity <= 0) return;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(distortion) * 0.25);

        const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
        grad.addColorStop(0, `rgba(255, 40, 80, ${0.11 * intensity})`);
        grad.addColorStop(0.22, `rgba(255, 190, 40, ${0.09 * intensity})`);
        grad.addColorStop(0.42, `rgba(80, 235, 120, ${0.09 * intensity})`);
        grad.addColorStop(0.62, `rgba(40, 190, 255, ${0.105 * intensity})`);
        grad.addColorStop(0.82, `rgba(120, 80, 255, ${0.09 * intensity})`);
        grad.addColorStop(1, `rgba(255, 70, 220, ${0.105 * intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

        ctx.restore();
    }

    function drawColorTint(ctx, x, y, radius, color, intensity) {
        const [red, green, blue] = color;
        const tint = ctx.createRadialGradient(
            x - radius * 0.32, y - radius * 0.38, radius * 0.08,
            x, y, radius
        );
        tint.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${0.08 * intensity})`);
        tint.addColorStop(0.58, `rgba(${red}, ${green}, ${blue}, ${0.18 * intensity})`);
        tint.addColorStop(1, `rgba(${red}, ${green}, ${blue}, ${0.38 * intensity})`);

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = tint;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore();
    }

    function drawGlassShell(ctx, x, y, radius, alpha) {
        const rim = ctx.createRadialGradient(x, y, radius * 0.70, x, y, radius);
        rim.addColorStop(0, 'rgba(255,255,255,0)');
        rim.addColorStop(0.78, 'rgba(255,255,255,0.018)');
        rim.addColorStop(0.94, 'rgba(255,255,255,0.08)');
        rim.addColorStop(1, 'rgba(255,255,255,0.16)');
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = rim;
        ctx.fill();

        ctx.lineWidth = Math.max(0.6, radius * 0.018);
        ctx.strokeStyle = `rgba(255,255,255,${0.11 * alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius - ctx.lineWidth * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        const lower = ctx.createLinearGradient(x, y - radius, x, y + radius);
        lower.addColorStop(0, 'rgba(255,255,255,0)');
        lower.addColorStop(0.72, 'rgba(255,255,255,0)');
        lower.addColorStop(1, 'rgba(255,255,255,0.028)');
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.94, 0, Math.PI * 2);
        ctx.fillStyle = lower;
        ctx.fill();
    }

    function draw(ctx, x, y, radius, options) {
        const settings = options || {};
        const alpha = clamp01(settings.alpha == null ? 1 : settings.alpha);
        if (alpha <= 0 || radius <= 0) return;

        const rainbow = clamp01(settings.rainbow == null ? 0.2 : settings.rainbow);
        const distortion = settings.distortion == null ? (x * 0.012 + y * 0.008) : settings.distortion;
        const hue = ((settings.hue == null ? distortion * 57.2958 : settings.hue) % 360 + 360) % 360;
        const colorIndex = Math.floor(hue / 360 * BUBBLE_COLORS.length) % BUBBLE_COLORS.length;

        ctx.save();
        ctx.globalAlpha *= alpha;
        drawRefractedBackground(ctx, x, y, radius, distortion, rainbow);
        drawColorTint(ctx, x, y, radius, BUBBLE_COLORS[colorIndex], 0.75 + rainbow * 0.25);
        drawRainbowTint(ctx, x, y, radius, rainbow * 0.35, distortion);
        drawGlassShell(ctx, x, y, radius, alpha);
        ctx.restore();
    }

    window.GlassBall = { draw };
}());
