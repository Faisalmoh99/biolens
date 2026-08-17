export function generateSyntheticIris(seed: number, size = 512): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  const hue = (seed * 67) % 360;
  for (let r = size * 0.12; r < size * 0.45; r += 4) {
    const angle = (seed * r * 0.05) % (Math.PI * 2);
    ctx.strokeStyle = `hsl(${hue + r * 0.2}, ${50 + (seed * 7) % 30}%, ${30 + Math.sin(r * 0.1 + seed) * 20}%)`;
    ctx.lineWidth = 1.5 + (seed % 3);
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const noise = Math.sin(a * (3 + seed) + r * 0.1) * 3;
      const x = size / 2 + Math.cos(a + angle) * (r + noise);
      const y = size / 2 + Math.sin(a + angle) * (r + noise);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

export function getReferenceIrisImageUrl(pilgrimId: string): string {
  return `/data/iris_refs/${pilgrimId}.jpg`;
}
