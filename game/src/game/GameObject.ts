import type { Camera } from "./Camera";
import type { Game } from "./game";
import { Matrix2D } from "./matrix2D";
import { Vec2 } from "./Vec2";

export class GameObject {
    private _position: Vec2 = new Vec2();
    private _scale: Vec2 = new Vec2(1, 1);

    public rotation: number = 0; // in radians
    public visible: boolean = true;
    public zIndex: number = 0;

    public parent: GameObject | null = null;
    public children: GameObject[] = [];

    // 变换矩阵
    public localTransform: Matrix2D = new Matrix2D();
    public worldTransform: Matrix2D = new Matrix2D();

    // 标记变换是否需要重新计算
    private _isDirty: boolean = true;
    public camera: Camera | null = null;
    public game: Game

    constructor(game: Game) {
        this.game = game
    }

    asset(name:string){
        return this.game.asset(name)
    }

    getCamera(){
        return this.camera || this.game.mainCamera
    }

    get position(): Vec2 {
        return this._position;
    }
    set position(value: Vec2) {
        this._position.copyFrom(value);
        this.setDirty();
    }

    get x(): number {
        return this._position.x;
    }
    set x(value: number) {
        if (this._position.x !== value) {
            this._position.x = value;
            this.setDirty();
        }
    }

    get y(): number {
        return this._position.y;
    }
    set y(value: number) {
        if (this._position.y !== value) {
            this._position.y = value;
            this.setDirty();
        }
    }

    get scale(): Vec2 {
        return this._scale;
    }
    set scale(value: Vec2) {
        this._scale.copyFrom(value);
        this.setDirty();
    }

    get scaleX(): number {
        return this._scale.x;
    }
    set scaleX(value: number) {
        if (this._scale.x !== value) {
            this._scale.x = value;
            this.setDirty();
        }
    }

    get scaleY(): number {
        return this._scale.y;
    }
    set scaleY(value: number) {
        if (this._scale.y !== value) {
            this._scale.y = value;
            this.setDirty();
        }
    }

    addChild(child: GameObject) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
    }

    removeChild(child: GameObject) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
    }

    // 标记自己和所有子节点的变换为“脏”，需要在下一帧重新计算
    setDirty() {
        if (!this._isDirty) {
            this._isDirty = true;
            for (const child of this.children) {
                child.setDirty();
            }
        }
    }

    // 更新世界变换矩阵
    updateTransform() {
        if (this._isDirty) {
            // 1. 计算局部变换 (Now using Vec2 properties)
            this.localTransform.identity()
                .translate(this._position.x, this._position.y)
                .rotate(this.rotation)
                .scale(this._scale.x, this._scale.y);

            // 2. 计算世界变换
            if (this.parent) {
                this.worldTransform.copyFrom(this.parent.worldTransform).append(this.localTransform);
            } else {
                this.worldTransform.copyFrom(this.localTransform);
            }

            this._isDirty = false;
        }
    }

    // 递归调用，先更新自己，再更新所有子节点
    // 并且将需要渲染的节点加入渲染队列
    update(deltaTime: number, renderQueue: GameObject[]) {
        // 更新自己的逻辑
        this.onUpdate(deltaTime);

        // 更新变换
        this.updateTransform();

        // 如果可见，将自己加入渲染队列
        if (this.visible) {
            renderQueue.push(this);
        }

        // 递归更新子节点
        for (const child of this.children) {
            child.update(deltaTime, renderQueue);
        }
    }

    render(ctx: CanvasRenderingContext2D) {

    }

    protected onUpdate(deltaTime: number) {

    }

    /**
     * Gets the global position of the object's origin point.
     * @returns {Vec2} A new Vec2 instance representing the world position.
     */
    public getGlobalPosition(): Vec2 {
        this.updateTransform();
        return new Vec2(this.worldTransform.tx, this.worldTransform.ty);
    }

    // Using TypeScript function overloading for maximum flexibility
    public globalToLocal(globalPos: Vec2): Vec2;
    public globalToLocal(globalX: number, globalY: number): Vec2;
    public globalToLocal(arg1: Vec2 | number, arg2?: number): Vec2 {
        this.updateTransform();
        const inverseWorldTransform = this.worldTransform.clone().invert();

        const x = arg1 instanceof Vec2 ? arg1.x : arg1;
        const y = arg1 instanceof Vec2 ? arg1.y : arg2!;

        const localPoint = inverseWorldTransform.transformPoint(x, y);
        return new Vec2(localPoint.x, localPoint.y);
    }

    public localToGlobal(localPos: Vec2): Vec2;
    public localToGlobal(localX: number, localY: number): Vec2;
    public localToGlobal(arg1: Vec2 | number, arg2?: number): Vec2 {
        this.updateTransform();

        const x = arg1 instanceof Vec2 ? arg1.x : arg1;
        const y = arg1 instanceof Vec2 ? arg1.y : arg2!;

        const globalPoint = this.worldTransform.transformPoint(x, y);
        return new Vec2(globalPoint.x, globalPoint.y);
    }

    destory(){
        this.parent?.removeChild(this)
    }
}