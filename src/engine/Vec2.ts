/**
 * A 2D vector
 */

export class Vec2 {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public toString(): string {
        return `(${this.x}, ${this.y})`;
    }

    /**
     * @param v1 Vector 1
     * @param v2 Vector 1
     * @returns The distance between `v1` and`v2`.
     */
    static dist(v1: Vec2, v2: Vec2): number {
        return Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
    }

    /**
     * @param v1 Vector 1
     * @param v2 Vector 2
     * @returns The dot product of `v1` and `v2`
     */
    static dot(v1: Vec2, v2: Vec2): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * @param v1 Vector 1
     * @param v2 Vector 2
     * @returns The cross product of `v1` and `v2`
     */
    static cross(v1: Vec2, v2: Vec2): number {
        return v1.x * v2.y - v1.y * v2.x;
    }

    /**
     * Normalizes a vector.
     * @param v A vector to normalize.
     * @returns Vector `v` normalized.
     */
    static normalize(v: Vec2): Vec2 {
        const mag = Math.sqrt(v.x * v.x + v.y * v.y);
        return new Vec2(v.x / mag, v.y / mag);
    }

    /**
     * Adds two vectors component-wise
     * @param v1 Vector 1
     * @param v2 Vector 2
     * @returns Vector `v1` + `v2`
     */
    static compAdd(v1: Vec2, v2: Vec2): Vec2 {
        return new Vec2(v1.x + v2.x, v1.y + v2.y);
    }

    /**
     * Subtracts two vectors component-wise
     * @param v1 Vector 1
     * @param v2 Vector 2
     * @returns Vector `v1` - `v2`
     */
    static compSub(v1: Vec2, v2: Vec2): Vec2 {
        return new Vec2(v1.x - v2.x, v1.y - v2.y);
    }

    /**
     * Multiplies two vectors component-wise
     * @param v1 Vector 1
     * @param v2 Vector 2
     * @returns Vector `v1` * `v2`
     */
    static compMul(v1: Vec2, v2: Vec2): Vec2 {
        return new Vec2(v1.x * v2.x, v1.y * v2.y);
    }

    /**
     * Multiplies a vector by a scalar
     * @param v Vector to multiply
     * @param scalar Scalar to multiply by
     * @returns Vector `v` * `scalar`
     */
    static compMulScalar(v: Vec2, scalar: number): Vec2 {
        return new Vec2(v.x * scalar, v.y * scalar);
    }

    /**
     * Divides two vectors component-wise
     * @param v1 Vector 1
     * @param v2 Vector 2
     * @returns Vector `v1` / `v2`
     */
    static compDiv(v1: Vec2, v2: Vec2): Vec2 {
        return new Vec2(v1.x / v2.x, v1.y / v2.y);
    }

    /**
     * Divides a vector by a scalar
     * @param v Vector to divide
     * @param scalar Scalar to divide by
     * @returns Vector `v` / `scalar`
     */
    static compDivScalar(v: Vec2, scalar: number): Vec2 {
        return new Vec2(v.x / scalar, v.y / scalar);
    }
}
