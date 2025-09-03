<template>
    <div v-if="store.linkData && !isTarget" class="tile-start"
        :style="{ left: `${selectedTile.worldx}px`, top: `${selectedTile.worldy}px` }">
        <p>{{ store.linkData.slot }}</p>
    </div>

    <div class="tile-info" v-else-if="selectedTile" style="position: fixed;"
        :style="{ left: `calc(${selectedTile.worldx}px - 6rem)`, top: `calc(${selectedTile.worldy}px - 10rem - 30px)` }">

        <div>
            <h4>{{ item.name }}</h4>
            <p>{{ item.describe }}</p>
            <div style="display: flex;margin-top: 0.5rem;">
                <div class="l" v-show="!isTarget || store.linkData?.type == IO_TYPE.OUTPUT">
                    <h4>输入</h4>
                    <p v-for="input in item.inputs">
                        <button
                            :class="{ 'active': store.linkData?.slot == input && store.linkData.type != IO_TYPE.INPUT }"
                            class="btn"
                            @click="store.linkData ? mainStage.setConnectTarget(input) : mainStage.setConnectSource(input, IO_TYPE.INPUT)">{{
                            input }}</button>
                    </p>
                </div>
                <div class="l" v-show="!isTarget || store.linkData?.type == IO_TYPE.INPUT">
                    <h4>输出</h4>
                    <p v-for="output in item.outputs">
                        <button
                            :class="{ 'active': store.linkData?.slot == output && store.linkData.type != IO_TYPE.OUTPUT }"
                            class="btn"
                            @click="store.linkData ? mainStage.setConnectTarget(output) : mainStage.setConnectSource(output, IO_TYPE.OUTPUT)">{{
                                output }}</button>
                    </p>
                </div>
            </div>
            <!-- <div style="margin-top: 0.5rem;" v-show="!store.linkData">
                <button @click="sell">出售</button>
            </div> -->
            <p v-show="store.linkData">{{ isTarget ? "提示：请选择输入节点" : "提示：请选择输出节点" }}</p>
        </div>
    </div>

</template>
<script lang="ts" setup>
import { tiles } from '@/game/datas';
import { computed } from 'vue';
import { useGameStore } from '@/stores/game';
import type { Game } from '@/game/game';
import { IO_TYPE, mainStage, type ISelectedTile, type MainScene } from '@/game/scene/main';

const store = useGameStore()

const props = defineProps<{
    selectedTile: ISelectedTile
    isTarget: boolean
}>()

const item = computed(() => tiles[props.selectedTile.prototypeId])

const sell = () => {
    mainStage.selectItem(null)
}
</script>

<style scoped>
.tile-info {
    background-color: white;
    padding: 0.5rem;
    border: 2px solid #000;
    width: 12rem;
    height: 10rem;
    position: relative;
    pointer-events: all;
}

/* 小三角 */
.tile-info::after {
    content: '';
    position: absolute;
    bottom: -10px;

    left: 50%;

    transform: translateX(-100%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid rgb(0, 0, 0);
}

.active {
    background-color: antiquewhite !important;
}

.btn {
    border: 2px solid #000;
    background-color: rgb(255, 255, 255);
}

.btn:disabled {
    color: #000;
    border-color: #dfdfdf;
}

.btn:hover:not(:disabled) {
    background-color: rgb(207, 207, 207);
}

.tile-start {
    position: fixed;
    background-color: rgb(52, 255, 7);
}

.l {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
}
</style>