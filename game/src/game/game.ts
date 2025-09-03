import { useGameStore } from "@/stores/game";
import { Camera } from "./Camera";
import { GameObject } from "./GameObject";
import type { Matrix2D } from "./matrix2D";
import { start as startMain } from "./scene/main"
import mitt from "mitt";

export class CanvasScaler {
    canvas: HTMLCanvasElement;
    public baseWidth: number;
    public baseHeight: number;

    public logicalWidth: number;
    public logicalHeight: number;

    public viewportWidth: number;
    public viewportHeight: number;

    public dpr: number = 1;

    constructor(canvas: HTMLCanvasElement, baseWidth: number, baseHeight: number) {
        this.canvas = canvas;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;

        this.logicalWidth = baseWidth;
        this.logicalHeight = baseHeight;

        this.viewportHeight = baseWidth
        this.viewportWidth = baseHeight

        this.resize();
        window.addEventListener("resize", () => this.resize());
    }

    resize() {
        const parent = this.canvas.parentElement || document.body;
        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;

        const baseRatio = this.baseWidth / this.baseHeight;
        const parentRatio = parentWidth / parentHeight;

        let newLogicalWidth: number;
        let newLogicalHeight: number;

        if (parentRatio > baseRatio) {
            newLogicalHeight = this.baseHeight;
            newLogicalWidth = this.baseHeight * parentRatio;
        } else {
            newLogicalWidth = this.baseWidth;
            newLogicalHeight = this.baseWidth / parentRatio;
        }

        this.dpr = window.devicePixelRatio || 1;

        this.logicalWidth = newLogicalWidth;
        this.logicalHeight = newLogicalHeight;

        this.canvas.style.width = parentWidth + "px";
        this.canvas.style.height = parentHeight + "px";

        this.viewportHeight = Math.round(parentHeight * this.dpr)
        this.viewportWidth = Math.round(parentWidth * this.dpr)

        this.canvas.width = this.viewportWidth
        this.canvas.height = this.viewportHeight
    }

    getContext() {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.imageSmoothingQuality = "low";
        }
        return ctx;
    }
}

type Events = {
    load: { url: string; name?: string; img: HTMLCanvasElement | HTMLImageElement };
    progress: number;
    complete: void;
};

export class AssetsManager {
    private cache: Map<string, HTMLImageElement | HTMLCanvasElement> = new Map(); // url -> image/texture
    private nameMap: Map<string, string> = new Map(); // name -> url
    private emitter = mitt<Events>();

    on = this.emitter.on;
    off = this.emitter.off;

    /**
     * 加载单个资源
     * - 如果是 svg，会转成 canvas 缓存
     */
    async load(url: string, name?: string): Promise<HTMLImageElement | HTMLCanvasElement> {
        if (this.cache.has(url)) {
            return Promise.resolve(this.cache.get(url)!);
        }

        const isSvg = url.endsWith(".svg");
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let final: HTMLImageElement | HTMLCanvasElement = img;

                if (isSvg) {
                    // 转 canvas（纹理）
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d")!;
                    ctx.drawImage(img, 0, 0);
                    final = canvas;
                }

                this.cache.set(url, final);
                if (name) this.nameMap.set(name, url);
                this.emitter.emit("load", { url, name, img: final });
                resolve(final);
            };
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    }

    /**
     * 批量加载
     */
    async loadAll(
        assets: { url: string; name?: string }[]
    ): Promise<Map<string, HTMLImageElement | HTMLCanvasElement>> {
        let loaded = 0;
        const total = assets.length;

        const results = await Promise.all(
            assets.map(({ url, name }) =>
                this.load(url, name).then((img) => {
                    loaded++;
                    this.emitter.emit("progress", loaded / total);
                    return img;
                })
            )
        );

        this.emitter.emit("complete");
        return new Map(assets.map(({ url }, i) => [url, results[i]]));
    }

    /**
     * 根据 url 或 name 获取资源
     */
    get(key: string) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        if (this.nameMap.has(key)) {
            const url = this.nameMap.get(key)!;
            return this.cache.get(url);
        }
        return undefined;
    }

    clear() {
        this.cache.clear();
        this.nameMap.clear();
    }
}


export class Game {
    scaler!: CanvasScaler;
    private ctx!: CanvasRenderingContext2D | null;
    private lastTime: number = 0;

    public stage: GameObject;
    private renderQueue: GameObject[] = [];
    mainCamera: Camera = new Camera(this);
    alive: boolean = true
    assets = new AssetsManager()
    store: ReturnType<typeof useGameStore>

    constructor() {
        this.stage = new GameObject(this);
        this.mainCamera.center = true
        //@ts-ignore
        window.game = this
        this.store = useGameStore();
    }

    async preload() {
        await this.assets.loadAll([
            { url: "./resource.svg", name: "resource" },
            { url: "./home.svg", name: "home" },
            { url: "./classifier.svg", name: "classifier" },
            { url: "./miner.svg", name: "miner" },
            { url: "./incinerator.svg", name: "incinerator" },
            { url: "./wall.svg", name: "wall" },
            { url: "./zombie.svg", name: "zombie" }
        ])
    }

    asset(name: string) {
        return this.assets.get(name)
    }

    start(canvas: HTMLCanvasElement) {
        this.scaler = new CanvasScaler(canvas, 800, 600);
        this.ctx = this.scaler.getContext();
        this.lastTime = performance.now();
        this.loop(this.lastTime);

        startMain(this)
    }

    loop(currentTime: number) {
        if (!this.ctx || !this.scaler) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.renderQueue = [];

        // 更新阶段
        this.stage.update(deltaTime, this.renderQueue);

        // 渲染阶段
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.renderQueue.sort((a, b) => a.zIndex - b.zIndex);

        for (const obj of this.renderQueue) {
            this.ctx.save();

            // 决定使用哪个相机
            const camera = obj.camera || this.mainCamera;

            let finalTransform: Matrix2D;

            if (camera) {
                const viewMatrix = camera.getViewMatrix();
                finalTransform = viewMatrix.clone().append(obj.worldTransform);
            } else {
                finalTransform = obj.worldTransform;
            }

            const m = finalTransform;
            const dpr = this.scaler.dpr;

            // 这样，游戏逻辑中的 (10, 20) 坐标就会被正确地绘制到物理像素的 (10*dpr, 20*dpr) 位置
            this.ctx.setTransform(
                m.a,
                m.b,
                m.c,
                m.d,
                m.tx,
                m.ty
            );

            obj.render(this.ctx);

            this.ctx.restore();
        }

        if (this.alive) {
            requestAnimationFrame((time) => this.loop(time));
        }
    }

    destory() {
        this.alive = false
    }
}