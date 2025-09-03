export const items: Record<string, string[]> = {
    '资源': [
        'classifier',
        'miner',
        'incinerator',
    ],
    '人民': [],
    '防御': [],
    '战斗': []
}

export interface ITileInfo {
    name: string,
    image: string;
    describe: string;
    inputs?: string[];
    outputs?: string[];
}

export const tiles: Record<string, ITileInfo> = {
    'classifier': {
        name: "分类机",
        image: "./classifier.svg",
        describe: "自动分拣资源的设施",
        inputs: ["输入A", "输入B"],
        outputs: ["输出A", "输出B"]
    },
    'miner': {
        name: "采集器",
        image: "./miner.svg",
        describe: "开采资源的机器",

        inputs: [],
        outputs: ["输出"]
    },
    'incinerator': {
        name: "焚化炉",
        image: "./incinerator.svg",
        describe: "销毁无用物品的设施",
        inputs: ["输入"]
    },
    'resource': {
        name: "资源",
        image: "./resource.svg",
        describe: "资源",
    }
}