export class Matrix2D {
    a: number; b: number;
    c: number; d: number;
    tx: number; ty: number;

    constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
        this.a = a; this.b = b;
        this.c = c; this.d = d;
        this.tx = tx; this.ty = ty;
    }

    identity(): this {
        this.a = 1; this.b = 0;
        this.c = 0; this.d = 1;
        this.tx = 0; this.ty = 0;
        return this;
    }

    // this = this * other
    append(other: Matrix2D): this {
        const a1 = this.a, b1 = this.b, c1 = this.c, d1 = this.d, tx1 = this.tx, ty1 = this.ty;
        const a2 = other.a, b2 = other.b, c2 = other.c, d2 = other.d, tx2 = other.tx, ty2 = other.ty;

        this.a = a1 * a2 + b1 * c2;
        this.b = a1 * b2 + b1 * d2;
        this.c = c1 * a2 + d1 * c2;
        this.d = c1 * b2 + d1 * d2;
        this.tx = a1 * tx2 + b1 * ty2 + tx1;
        this.ty = c1 * tx2 + d1 * ty2 + ty1;
        return this;
    }

    // this = other * this
    prepend(other: Matrix2D): this {
        const a1 = other.a, b1 = other.b, c1 = other.c, d1 = other.d, tx1 = other.tx, ty1 = other.ty;
        const a2 = this.a, b2 = this.b, c2 = this.c, d2 = this.d, tx2 = this.tx, ty2 = this.ty;

        this.a = a1 * a2 + b1 * c2;
        this.b = a1 * b2 + b1 * d2;
        this.c = c1 * a2 + d1 * c2;
        this.d = c1 * b2 + d1 * d2;
        this.tx = a1 * tx2 + b1 * ty2 + tx1;
        this.ty = c1 * tx2 + d1 * ty2 + ty1;
        return this;
    }

    translate(x: number, y: number): this {
        this.tx += this.a * x + this.c * y;
        this.ty += this.b * x + this.d * y;
        return this;
    }

    scale(x: number, y: number): this {
        this.a *= x; this.b *= x;
        this.c *= y; this.d *= y;
        return this;
    }

    rotate(angle: number): this {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const a1 = this.a, b1 = this.b, c1 = this.c, d1 = this.d;

        this.a = a1 * cos - c1 * sin;
        this.b = b1 * cos - d1 * sin;
        this.c = a1 * sin + c1 * cos;
        this.d = b1 * sin + d1 * cos;
        return this;
    }

    clone(): Matrix2D {
        return new Matrix2D(this.a, this.b, this.c, this.d, this.tx, this.ty);
    }

    copyFrom(other: Matrix2D): this {
        this.a = other.a; this.b = other.b;
        this.c = other.c; this.d = other.d;
        this.tx = other.tx; this.ty = other.ty;
        return this;
    }

    invert(): this {
        const a1 = this.a;
        const b1 = this.b;
        const c1 = this.c;
        const d1 = this.d;
        const tx1 = this.tx;
        const ty1 = this.ty;

        const determinant = a1 * d1 - b1 * c1;

        if (determinant === 0) {
            return this.identity();
        }

        const invDet = 1 / determinant;

        this.a = d1 * invDet;
        this.b = -b1 * invDet;
        this.c = -c1 * invDet;
        this.d = a1 * invDet;
        this.tx = (c1 * ty1 - d1 * tx1) * invDet;
        this.ty = (b1 * tx1 - a1 * ty1) * invDet;

        return this;
    }

    transformPoint(x: number, y: number): { x: number, y: number } {
        return {
            x: this.a * x + this.c * y + this.tx,
            y: this.b * x + this.d * y + this.ty
        };
    }
}