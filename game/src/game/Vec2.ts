export class Vec2 {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 设置向量的 x 和 y 值。
     * @returns {this} 当前向量，方便链式调用。
     */
    set(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * 将另一个向量的值复制到当前向量。
     * @returns {this} 当前向量。
     */
    copyFrom(other: Vec2): this {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    /**
     * 克隆当前向量，返回一个具有相同 x 和 y 值的新 Vec2 实例。
     * @returns {Vec2} 新的 Vec2 实例。
     */
    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    /**
     * 将当前向量与另一个向量相加。
     * @returns {this} 当前向量。
     */
    add(other: Vec2): this {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    /**
     * 从当前向量中减去另一个向量。
     * @returns {this} 当前向量。
     */
    subtract(other: Vec2): this {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    /**
     * 将当前向量乘以一个标量。
     * @returns {this} 当前向量。
     */
    multiplyScalar(scalar: number): this {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * 将当前向量除以一个标量。
     * @returns {this} 当前向量。
     */
    divideScalar(scalar: number): this {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        } else {
            this.x = 0;
            this.y = 0;
        }
        return this;
    }

    /**
     * 计算向量的长度（模）。
     * @returns {number} 向量的长度。
     */
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * 计算向量长度的平方。在仅比较长度时，此方法性能更高，因为它避免了开方运算。
     * @returns {number} 向量长度的平方。
     */
    lengthSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * 将向量归一化（使其长度为 1）。
     * @returns {this} 当前向量。
     */
    normalize(): this {
        const len = this.length();
        if (len > 0) {
            this.divideScalar(len);
        }
        return this;
    }

    /**
     * 计算与另一个向量的点积。
     * @returns {number} 点积的结果。
     */
    dot(other: Vec2): number {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * 计算与另一个向量的距离。
     * @returns {number} 两个点之间的距离。
     */
    distanceTo(other: Vec2): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算与另一个向量距离的平方。
     * @returns {number} 两个点之间距离的平方。
     */
    distanceToSq(other: Vec2): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return dx * dx + dy * dy;
    }

    /**
     * 将向量的长度限制在最大值以内。
     * @param max 最大长度。
     * @returns {this} 当前向量。
     */
    limit(max: number): this {
        const lenSq = this.lengthSq();
        if (lenSq > max * max) {
            this.normalize().multiplyScalar(max);
        }
        return this;
    }

    /**
     * 获取从(0,0)到该点的角度 (弧度)。
     * @returns {number} 角度（弧度）。
     */
    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    /**
     * 线性插值到另一个向量。
     * @param other 目标向量。
     * @param t 插值因子 (0.0 to 1.0)。
     * @returns {this} 当前向量。
     */
    lerp(other: Vec2, t: number): this {
        this.x += (other.x - this.x) * t;
        this.y += (other.y - this.y) * t;
        return this;
    }

    /**
     * 检查当前向量是否与另一个向量相等。
     * @param other 要比较的向量。
     * @returns {boolean} 如果 x 和 y 分量都相等，则返回 true。
     */
    equals(other: Vec2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    // --- 静态方法 (不修改原向量，返回新实例) ---

    /**
     * 两个向量相加，返回一个新向量。
     */
    static add(v1: Vec2, v2: Vec2): Vec2 {
        return new Vec2(v1.x + v2.x, v1.y + v2.y);
    }

    /**
     * 两个向量相减，返回一个新向量。
     */
    static subtract(v1: Vec2, v2: Vec2): Vec2 {
        return new Vec2(v1.x - v2.x, v1.y - v2.y);
    }

    /**
     * 从角度创建一个单位向量。
     * @param angle 角度（弧度）。
     * @returns {Vec2} 新的单位向量。
     */
    static fromAngle(angle: number): Vec2 {
        return new Vec2(Math.cos(angle), Math.sin(angle));
    }
}