<script setup lang="ts">
import TilePanel from '@/components/TilePanel.vue';
import { items, tiles } from '@/game/datas';
import { Game } from '@/game/game';
import { mainStage, type MainScene } from '@/game/scene/main';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, reactive, ref } from 'vue';

const canvasElm = ref<HTMLCanvasElement | null>(null);
const game = new Game()
const loadingAssets = ref(true)
const loadingProgress = ref(0)

const store = useGameStore()
const { selectedItem, selectedTile, selectedTargetTile, roomState, roomSelfState } = storeToRefs(store)

const selectedCategory = ref<string>(Object.keys(items)[0])

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
</script>

<template>
  <canvas ref="canvasElm"></canvas>
  <div class="hud">
    <p v-if="loadingAssets">载入资源中 {{ (loadingProgress * 100).toFixed(0) }}%</p>
    <p v-if="!roomSelfState?.hasHome">请建造一个家后开始游戏（推荐在资源附近建造）</p>

    <TilePanel v-if="selectedTile" :selectedTile="selectedTile" :isTarget="false"></TilePanel>
    <TilePanel v-if="selectedTargetTile" :selectedTile="selectedTargetTile" :isTarget="true"></TilePanel>

    <div class="right-bar" v-if="!store.linkData">
      <div v-if="selectedItem" class="item-detail">
        <img :src="tiles[selectedItem].image" width="40" height="40" />
        <div>
          <h5>{{ tiles[selectedItem].name }}</h5>
          <p style="color: gray;">{{ tiles[selectedItem].describe }}</p>
        </div>
      </div>

      <div class="build-panel">
        <!-- 分类按钮 -->
        <div style="display: flex; gap: 0.25rem;">
          <button v-for="categoryName in Object.keys(items)" :key="categoryName" style="flex: 1"
            :class="{ active: selectedCategory === categoryName }" @click="selectCategory(categoryName)">
            {{ categoryName }}
          </button>
        </div>

        <!-- 物品网格 -->
        <div class="items-grid">
          <button v-for="item in items[selectedCategory]" :key="item" :class="{ active: selectedItem === item }"
            @click="mainStage.selectItem(item)" :disabled="!(roomSelfState?.hasHome || item == 'home')" v-show="item != 'home' || !roomSelfState?.hasHome">
            <img :src="tiles[item].image" width="30" height="30">
            <p style="margin: 0;">{{ tiles[item].name }}</p>
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
</style>
