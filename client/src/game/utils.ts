export function to2DArray(arr: number[], cols: number) {
    const result = [];
    for (let i = 0; i < arr.length; i += cols) {
        result.push(arr.slice(i, i + cols));
    }
    return result;
}
