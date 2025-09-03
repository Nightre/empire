<script setup lang="ts">
import { Game } from '@/game/game';
import type { MainScene } from '@/game/scene/main';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, reactive, ref } from 'vue';

const canvasElm = ref<HTMLCanvasElement | null>(null);
const game = new Game()
const loadingAssets = ref(true)
const loadingProgress = ref(0)

export interface IBuildItem {
  name: string,
  id: string,
  iamge: string,
  describe: string
}
const store = useGameStore()
const { category, selectedItem, selectedTile } = storeToRefs(store)

const selectedCategory = ref<string>(Object.keys(category)[0])

onMounted(async () => {
  game.assets.on("complete", () => loadingAssets.value = false)
  game.assets.on("progress", (progress) => loadingProgress.value = progress)
  await game.preload()
  game.start(canvasElm.value!)
})

onUnmounted(() => {
  game.destory()
})

function selectCategory(name: string) {
  if (selectedCategory.value !== name) {
    selectedCategory.value = name
  }
}

function selectItem(item: IBuildItem) {
  store.selectItem(item)
  const mainScene = game.stage as MainScene
  mainScene.selectItem(selectedItem.value)
}
</script>

<template>
  <canvas ref="canvasElm"></canvas>
  <div class="hud">
    <p v-if="loadingAssets">载入资源中 {{ (loadingProgress * 100).toFixed(0) }}%</p>

    <div class="tile-info" v-if="selectedTile" style="position: fixed;"
      :style="{ left: `calc(${selectedTile.worldx}px - 10rem)`, top: `calc(${selectedTile.worldy}px - 10rem - 30px)` }">
      {{ selectedTile }}
      <button>出售</button>
    </div>

    <div class="right-bar">
      <div v-if="selectedItem" class="item-detail">
        <img :src="selectedItem.iamge" width="40" height="40" />
        <div>
          <h5>{{ selectedItem.name }}</h5>
          <p style="color: gray;">{{ selectedItem.describe }}</p>
        </div>
      </div>

      <div class="build-panel">
        <!-- 分类按钮 -->
        <div style="display: flex; gap: 0.25rem;">
          <button v-for="categoryName in Object.keys(category)" :key="categoryName" style="flex: 1"
            :class="{ active: selectedCategory === categoryName }" @click="selectCategory(categoryName)">
            {{ categoryName }}
          </button>
        </div>

        <!-- 物品网格 -->
        <div class="items-grid">
          <button v-for="item in category[selectedCategory]" :key="item.id"
            :class="{ active: selectedItem?.id === item.id }" @click="selectItem(item)">
            <img :src="item.iamge" width="30" height="30">
            <p style="margin: 0;">{{ item.name }}</p>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.hud {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.right-bar {
  position: fixed;
  right: 0;
  bottom: 0;
}

.build-panel {
  height: 15rem;
  width: 16rem;
  background-color: white;
  padding: 0.5rem;
  border: 2px solid #000;
  border-bottom: none;
  border-right: none;
  pointer-events: auto;
  overflow: auto;
}

.build-panel button.active {
  background-color: #ddd;
  font-weight: bold;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.2rem;
  margin-top: 0.5rem;
}

.items-grid button {
  height: 4.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f9f9f9;
  cursor: pointer;
}

.items-grid button.active {
  background: #cce5ff;
  border-color: #3399ff;
}

.item-detail {
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
  background-color: white;
  padding: 0.5rem;
  border: 2px solid #000;
  margin-bottom: 0.5rem;
  border-right: none;
}

.tile-info {
  background-color: white;
  padding: 0.5rem;
  border: 2px solid #000;
  width: 20rem;
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
</style>
