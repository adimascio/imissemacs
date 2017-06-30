
export function whitespaceRange(text: string, col: number): Array<number> {
    const start = col - /\s*$/.exec(text.substring(0, col))[0].length;
    const stop = col + /^\s*/.exec(text.substring(col))[0].length;
    return (start !== stop) ? [start, stop] : null;
}
