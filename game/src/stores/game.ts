import { mainStage, type ILinkData, type ISelectedTile } from '@/game/scene/main'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MyRoomState, Player } from '../../../server/src/rooms/schema/MyRoomState'

export const useGameStore = defineStore('game', () => {
  const selectedItem = ref<string | null>(null)
  const selectedTile = ref<ISelectedTile | null>(null)
  const selectedTargetTile = ref<ISelectedTile | null>(null) // ✅ 新增：选中的目标 tile
  const linkData = ref<ILinkData | null>(null)
  const roomState = ref<ReturnType<MyRoomState["toJSON"]>>()
  const roomSelfState = ref<ReturnType<Player["toJSON"]>>()

  function selectItem(item: string | null) {
    selectedItem.value = item
  }

  function selectTile(tile: ISelectedTile | null) {
    selectedTile.value = tile
  }

  function selectTargetTile(tile: ISelectedTile | null) {
    selectedTargetTile.value = tile
  }

  function setSelectingLink(data: ILinkData | null) {
    linkData.value = data
  }

  return {
    selectedItem,
    selectedTile,
    selectedTargetTile,       // ✅ 暴露出去
    linkData,
    roomState,
    roomSelfState,

    selectTile,
    selectTargetTile, // ✅ 暴露方法
    selectItem,
    setSelectingLink,
  }
})
