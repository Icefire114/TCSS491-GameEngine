export class Timer {
    private last: number = performance.now();

    tick(): number {
        const now = performance.now();
        const delta = (now - this.last) / 1000;
        this.last = now;
        return delta;
    }
};
