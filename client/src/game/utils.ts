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
