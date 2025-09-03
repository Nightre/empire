import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { IBuildItem } from '@/views/HomeView.vue'
import type { Vec2 } from '@/game/Vec2'
import type { ITile, Tile } from '@/game/scene/main'

export const useGameStore = defineStore('game', () => {
  const category = ref<Record<string, IBuildItem[]>>({
    '资源': [
      { name: '分拣机', id: 'classifier', iamge: "./classifier.svg", describe: "自动分拣资源的设施" },
      { name: '矿机', id: 'miner', iamge: "./miner.svg", describe: "开采资源的机器" },
      { name: '焚化炉', id: 'incinerator', iamge: "./incinerator.svg", describe: "销毁无用物品的设施" },
    ],
    '人民': [],
    '防御': [],
    '战斗': []
  })

  const selectedItem = ref<IBuildItem | null>(null)
  const selectedTile = ref<ITile | null>(null)

  function selectItem(item: IBuildItem | null) {
    selectedItem.value = item
  }

  function selectTile(item: ITile | null) {
    selectedTile.value = item
  }

  return { category, selectedItem, selectedTile: selectedTile, selectTile: selectTile, selectItem }
})