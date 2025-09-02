// 1D -> 2D
export function to2DArray(arr: number[], cols: number): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < arr.length; i += cols) {
        result.push(arr.slice(i, i + cols));
    }
    return result;
}

// 2D -> 1D
export function to1DArray(arr2d: number[][]): number[] {
    return arr2d.flat();
}

// 坐标 -> 索引
export function coordToIndex(x: number, y: number, cols: number): number {
    return y * cols + x;
}

// 索引 -> 坐标
export function indexToCoord(index: number, cols: number): {x: number, y: number} {
    return {
        x: index % cols,
        y: Math.floor(index / cols)
    };
}

export function randomBrightColor(): number {
  const hue = Math.random() * 360; // 随机色相
  const saturation = 70 + Math.random() * 30; // 70% - 100%
  const lightness = 90; // 50% - 70%
  return hslToHex(hue, saturation, lightness);
}

export function hslToHex(h: number, s: number, l: number): number {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return (r << 16) + (g << 8) + b;
}
