import { Wall, type RemoteTile } from "./scene/main";

export const items: Record<string, string[]> = {
    '资源': [
        'home',
        'classifier',
        'miner',
        'incinerator',
        'wall',
    ],
    '人民': [],
    '防御': [],
    '战斗': [],
}

export interface ITileInfo {
    name: string,
    image: string;
    describe: string;
    inputs?: string[];
    outputs?: string[];
    type?: typeof RemoteTile
    drawArc: boolean
}

export const tiles: Record<string, ITileInfo> = {
    'classifier': {
        name: "分类机",
        image: "./classifier.svg",
        describe: "自动分拣资源的设施",
        inputs: ["输入A", "输入B"],
        outputs: ["输出A", "输出B"],
        drawArc: true,
    },
    'miner': {
        name: "采集器",
        image: "./miner.svg",
        describe: "开采资源的机器",

        inputs: [],
        outputs: ["输出"],
        drawArc: true,
    },
    'incinerator': {
        name: "焚化炉",
        image: "./incinerator.svg",
        describe: "销毁无用物品的设施",
        inputs: ["输入"],
        drawArc: true,
    },
    'resource': {
        name: "资源",
        image: "./resource.svg",
        describe: "资源",
        drawArc: false,
    },
    'wall': {
        name: "墙壁",
        image: "./wall.svg",
        describe: "墙壁",
        type: Wall,
        drawArc: false,
    },
    'home': {
        name: "家",
        image: "./home.svg",
        describe: "家",
        type: Wall,
        drawArc: false,
    }
}