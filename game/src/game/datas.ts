import type { IBuildItem } from "@/views/HomeView.vue";

const items: Record<string, IBuildItem[]> = {
    '资源': [
        { name: '分拣机', id: 'classifier', iamge: "./classifier.svg", describe: "自动分拣资源的设施" },
        { name: '矿机', id: 'miner', iamge: "./miner.svg", describe: "开采资源的机器" },
        { name: '焚化炉', id: 'incinerator', iamge: "./incinerator.svg", describe: "销毁无用物品的设施" },
    ],
    '人民': [],
    '防御': [],
    '战斗': []
}

interface ITileInfo {
    image: string;
    describe: string; 
    inputs?: string[];
    outputs?: string[];
}

const tiles: Record<string, ITileInfo> = {
    'classifier': {
        image: "./classifier.svg",
        describe: "自动分拣资源的设施",
        inputs: ["输入A", "输入B"],
        outputs: ["输出A", "输出B"]
    },
    'miner': {
        image: "./miner.svg",
        describe: "开采资源的机器",

        inputs: [],
        outputs: ["输出"]
    },
    'incinerator': {
        image: "./incinerator.svg",
        describe: "销毁无用物品的设施",
        inputs: ["输入"]
    }
}