<script setup>
import { ref, watch } from 'vue'
import { GoogleMap, Marker, InfoWindow, AdvancedMarker } from 'vue3-google-map'
import { useGoogleMap } from '@/composables/useGoogleMap'
import router from '@/router';

const activeInfoWindow = ref(null)

const {
  apiKey,
  center,
  mapOptions,
  markers,
  currentPosition,
  currentLocationMarker,
  isLoading,
  error,
  addMarkers,
  locateCurrentPosition,
  createInfoContent
} = useGoogleMap({
  center: { lat: -32.9175, lng: -60.8137 },
  zoom: 13
})

// 获取店铺列表数据
const { data: storeList } = indexApi.storeList()

// 监听店铺数据变化
watch(storeList, (stores) => {
  if (stores?.length) {
    const markerData = stores.map(store => ({
      position: {
        lat: Number(store.lat),
        lng: Number(store.lng)
      },
      title: store.storeName,
      address: store.address,
      onClick: () => {
        router.push(`/store/${store.storeId}`)
      }
    }))
    
    addMarkers(markerData)
  }
}, { immediate: true })

// 计算每个店铺到当前位置的距离
const calculateDistances = () => {
  if (currentPosition.value && storeList.value) {
    storeList.value = storeList.value.map(store => ({
      ...store,
      distance: calculateDistance(
        currentPosition.value.lat,
        currentPosition.value.lng,
        store.lat,
        store.lng
      )
    }))
  }
}

// 计算两点之间的距离（公里）
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return Number((R * c).toFixed(1))
}

// 监听当前位置变化
watch(currentPosition, () => {
  calculateDistances()
})


const position = { lat: 1.363764, lng: 103.886012 }
const markerOptions = { position: position, title: 'LADY LIBERTY' }
const pinOptions = { background: '#18C686', borderColor: '#18C686' }

const toStoreList = () => {
  router.push('/')
}

</script>
<template>
  <div class="h-[calc(100vh-50px)] bg-background relative">
    <!-- 地图容器 -->
    <GoogleMap mapId="2a15a9c7f475d08a" :api-key="apiKey" :center="center" v-bind="mapOptions" class="w-full h-full">
      <!-- 店铺标记 -->
      <template v-for="marker in markers" :key="`${marker.position.lat}-${marker.position.lng}`">
        <!-- <Marker
          v-bind="marker"
          @click="activeInfoWindow = marker"
        /> -->

        <AdvancedMarker :options="marker" :pin-options="pinOptions" />
        <!-- v-if="activeInfoWindow === marker" -->
        <InfoWindow :options="{ position: marker.position, content: createInfoContent(marker) }"
          @closeclick="activeInfoWindow = null">
          <div v-html="createInfoContent(marker)" />
        </InfoWindow>
      </template>

      <!-- 当前位置标记 -->
      <!-- <Marker v-if="currentPosition" :position="currentPosition" v-bind="currentLocationMarker" /> -->
      <AdvancedMarker v-if="currentPosition" :options="{ position: currentPosition }" :pin-options="{ background: '#4285F4', borderColor: '#4285F4' }" />
    </GoogleMap>

    <!-- 工具栏 -->
    <div class="fixed left-4 bottom-15 flex flex-col gap-3 z-990">
      <!-- 定位按钮 -->
      <van-button round icon="aim" class="!w-40px !h-40px shadow-md bg-white" @click="locateCurrentPosition" />

      <!-- 店铺列表按钮 -->
      <van-button round icon="bars" class="!w-40px !h-40px shadow-md bg-white" @click="toStoreList" />
    </div>
  </div>
</template>

<style scoped>
:deep(.van-popup) {
  max-height: 75vh;
  overflow-y: auto;
}
</style>
