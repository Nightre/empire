import { GameObject } from "./GameObject";
import { Matrix2D } from "./matrix2D";
import { Vec2 } from "./Vec2";

export class Camera extends GameObject {
    public zoom: number = 1;

    // 视图矩阵，是相机世界变换的逆矩阵再结合缩放和视口中心偏移
    private _viewMatrix: Matrix2D = new Matrix2D();
    center: boolean = false
    /**
     * 获取用于渲染的视图矩阵。
     * @param viewportWidth 视口宽度
     * @param viewportHeight 视口高度
     * @returns {Matrix2D} 视图矩阵
     */
    public getViewMatrix(): Matrix2D {
        const viewportWidth = this.game.scaler.logicalWidth
        const viewportHeight = this.game.scaler.logicalHeight

        this.updateTransform();

        this._viewMatrix.copyFrom(this.worldTransform).invert();
        this._viewMatrix.prepend(new Matrix2D(this.zoom, 0, 0, this.zoom, 0, 0));

        if (this.center) {
            this._viewMatrix.prepend(new Matrix2D(1, 0, 0, 1, viewportWidth / 2, viewportHeight / 2));
        }

        return this._viewMatrix;
    }

    public screenToWorld(screenPos: Vec2): Vec2 {
        const inverseViewMatrix = this.getViewMatrix().clone().invert();
        const worldPoint = inverseViewMatrix.transformPoint(screenPos.x, screenPos.y);

        return new Vec2(worldPoint.x, worldPoint.y);
    }

    public worldToScreen(worldPos: Vec2): Vec2 {
        const viewMatrix = this.getViewMatrix();
        const screenPoint = viewMatrix.transformPoint(worldPos.x, worldPos.y);

        return new Vec2(screenPoint.x, screenPoint.y);
    }
}