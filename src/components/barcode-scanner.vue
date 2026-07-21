<script setup>
import { BrowserMultiFormatReader } from '@zxing/library'
import FlashlightSvg from '@/assets/icons/flashlight.svg'
import PictureSvg from '@/assets/icons/picture-album.svg'

const { t } = useI18n()

const videoRef = ref(null)
const overlayRef = ref(null)
let animationFrameId = null
const isScanning = ref(false)
const cameras = ref([])
const currentCameraIndex = ref(0)
const deviceId = ref('')
const fileInputRef = ref(null)
const isTorchOn = ref(false)
const lastFrameUrl = ref('')
const isResultShowing = ref(false)


const { width, height } = useWindowSize();

// 创建扫码器实例
const codeReader = new BrowserMultiFormatReader()

let canvasWidth, canvasHeight;

const setupCanvas = () => {
  const canvas = overlayRef.value;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
};

const drawPositions = (points) => {
  const canvas = overlayRef.value;
  if (!canvas || !points || points.length < 4) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const element = isResultShowing.value 
    ? document.querySelector('img') 
    : document.getElementById('qrcode-scanner');
  if (!element) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const elementAspectRatio = isResultShowing.value 
    ? element.naturalWidth / element.naturalHeight
    : element.videoWidth / element.videoHeight;
  const screenAspectRatio = canvasWidth / canvasHeight;

  let displayWidth, displayHeight;
  if (elementAspectRatio > screenAspectRatio) {
    displayHeight = canvasHeight;
    displayWidth = displayHeight * elementAspectRatio;
  } else {
    displayWidth = canvasWidth;
    displayHeight = displayWidth / elementAspectRatio;
  }

  const offsetX = (canvasWidth - displayWidth) / 2;
  const offsetY = (canvasHeight - displayHeight) / 2;

  const scaleX = displayWidth / (isResultShowing.value ? element.naturalWidth : element.videoWidth);
  const scaleY = displayHeight / (isResultShowing.value ? element.naturalHeight : element.videoHeight);

  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length * scaleX + offsetX;
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length * scaleY + offsetY;

  // 绘制边框圆
  ctx.beginPath();
  ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // 绘制填充圆
  ctx.beginPath();
  ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#00BBFC';
  ctx.fill();
};

// Sincroniza deviceId/índice con la cámara que el navegador realmente abrió
// (cuando dejamos elegir por facingMode no sabemos el deviceId de antemano).
const syncActiveCamera = () => {
  const video = document.getElementById('qrcode-scanner')
  const track = video?.srcObject?.getVideoTracks?.()[0]
  const settings = track?.getSettings?.()
  if (settings?.deviceId) {
    deviceId.value = settings.deviceId
    const idx = cameras.value.findIndex(c => c.deviceId === settings.deviceId)
    if (idx !== -1) currentCameraIndex.value = idx
  }
}

// 开始扫描
const openScan = async () => {
  try {
    isScanning.value = true
    const videoInputDevices = await codeReader.listVideoInputDevices()

    if (videoInputDevices.length) {
      cameras.value = videoInputDevices

      // Si el usuario eligió una cámara puntual (cambio manual) usamos ese
      // deviceId; si no, pedimos facingMode 'environment' para que el navegador
      // abra la trasera. Esto es más confiable que adivinar por índice —en
      // algunos Android el índice 1 era la frontal y se abría esa.
      const video = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        aspectRatio: { ideal: 1.7777777778 }, // 16:9
      }
      if (deviceId.value) {
        video.deviceId = { exact: deviceId.value }
      } else {
        video.facingMode = { ideal: 'environment' }
      }

      // 使用自定义约束进行解码
      await codeReader.decodeFromConstraints({ video }, 'qrcode-scanner', (result, error) => {
        if (result) {
          handleScanResult(result)
        }
        if (error && !(error instanceof TypeError)) {
          const ctx = overlayRef.value?.getContext('2d')
          ctx?.clearRect(0, 0, overlayRef.value.width, overlayRef.value.height)
        }
      })

      syncActiveCamera()
    }
  } catch (error) {
    console.error('Camera init failed:', error)
    showToast(t('routes.scan.camera.initFailed'))
    isScanning.value = false
  }
}

// 绘制定位框
const drawPositions1 = (points) => {
  const canvas = overlayRef.value
  if (!canvas || !points || points.length < 4) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const video = document.getElementById('qrcode-scanner')
  if (!video) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const videoAspectRatio = video.videoWidth / video.videoHeight
  const screenAspectRatio = window.innerWidth / window.innerHeight

  let displayWidth, displayHeight
  if (videoAspectRatio > screenAspectRatio) {
    displayHeight = window.innerHeight
    displayWidth = displayHeight * videoAspectRatio
  } else {
    displayWidth = window.innerWidth
    displayHeight = displayWidth / videoAspectRatio
  }

  const offsetX = (window.innerWidth - displayWidth) / 2
  const offsetY = (window.innerHeight - displayHeight) / 2

  const scaleX = displayWidth / video.videoWidth
  const scaleY = displayHeight / video.videoHeight

  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length * scaleX + offsetX
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length * scaleY + offsetY

  // 绘制边框圆
  ctx.beginPath()
  ctx.arc(centerX, centerY, 16, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  // ctx.lineWidth = 2
  // ctx.stroke()
  ctx.fill()

  // 绘制填充圆
  ctx.beginPath()
  ctx.arc(centerX, centerY, 14, 0, Math.PI * 2)
  ctx.fillStyle = '#00BBFC' // primary color
  ctx.fill()
}

// 解码视频流
const decodeFromInputVideo = async () => {
  try {
    let debounceTimer = null
    
    await codeReader.decodeFromVideoDevice(
      deviceId.value, 
      'qrcode-scanner',
      (result, error) => {
        if (result) {
          // 使用防抖避免过于频繁的重绘
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            if (result.resultPoints) {
              drawPositions(result.resultPoints)
            }
            handleScanResult(result)
          }, 100) // 降低防抖时间以使动画更流畅
        }
        if (error && !(error instanceof TypeError)) {
          // 清除画布
          const ctx = overlayRef.value?.getContext('2d')
          ctx?.clearRect(0, 0, overlayRef.value.width, overlayRef.value.height)
        }
      }
    )
  } catch (error) {
    console.error('Scan failed:', error)
    showToast(t('routes.scan.scanFailed'))
    isScanning.value = false
  }
}

// 处理扫描结果
const handleScanResult = (result) => {
  const scanResult = {
    text: result.getText(),
    format: result.getBarcodeFormat(),
    timestamp: new Date().toISOString()
  }
  
  if (scanResult.text !== lastResult.value) {
    lastResult.value = scanResult.text
    
    // 1. 先捕获最后一帧并绘制定位点
    const video = document.getElementById('qrcode-scanner')
    const canvas = document.createElement('canvas')
    
    // 使用实际视频分辨率
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d', {
      alpha: false,  // 禁用 alpha 通道以提高性能
      willReadFrequently: false  // 提示不会频繁读取像素
    })
    
    // 设置更好的图像平滑
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // 绘制视频帧
    ctx.drawImage(video, 0, 0)
    
    // 直接在捕获的帧上绘制定位圆形
    if (result.resultPoints && result.resultPoints.length >= 4) {
      const centerX = result.resultPoints.reduce((sum, p) => sum + p.x, 0) / result.resultPoints.length
      const centerY = result.resultPoints.reduce((sum, p) => sum + p.y, 0) / result.resultPoints.length
      
      // 绘制边框圆
      ctx.beginPath()
      ctx.arc(centerX, centerY, 32, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      // 绘制填充圆
      ctx.beginPath()
      ctx.arc(centerX, centerY, 28, 0, Math.PI * 2)
      ctx.fillStyle = '#00BBFC'
      ctx.fill()
    }
    
    // 保存带定位点的图片，使用最高质量
    lastFrameUrl.value = canvas.toDataURL('image/jpeg', 1.0)  // 使用最高质量 1.0
    isResultShowing.value = true
    
    // 2. 停止视频流
    const stream = video.srcObject
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    
    // 3. 清除 canvas 层
    const overlayCtx = overlayRef.value?.getContext('2d')
    if (overlayCtx) {
      overlayCtx.clearRect(0, 0, canvasWidth, canvasHeight)
    }
    
    emit('success', scanResult)
    stopScan()
  }
}

// 停止扫描
const stopScan = () => {
  codeReader.reset()
  isScanning.value = false
}

// 切换摄像头
const switchCamera = async () => {
  await stopScan()
  lastResult.value = '' // 重置上一次的扫描结果
  currentCameraIndex.value = (currentCameraIndex.value + 1) % cameras.value.length
  deviceId.value = cameras.value[currentCameraIndex.value].deviceId
  await openScan()
}

// 切换手电筒
const toggleTorch = async () => {
  try {
    const videoElement = document.getElementById('qrcode-scanner')
    if (!videoElement?.srcObject) {
      showToast(t('routes.scan.camera.notReady'))
      return
    }

    const mediaStream = videoElement.srcObject
    const track = mediaStream.getVideoTracks()[0]
    
    if (!track) {
      showToast(t('routes.scan.camera.noTrack'))
      return
    }

    const capabilities = track.getCapabilities()
    if (capabilities?.torch) {
      await track.applyConstraints({
        advanced: [{ torch: !isTorchOn.value }]
      })
      isTorchOn.value = !isTorchOn.value
    } else {
      showToast(t('routes.scan.camera.torchNotSupported'))
    }
  } catch (error) {
    console.error('Torch control failed:', error)
    showToast(t('routes.scan.camera.torchFailed'))
  }
}

// 选择图片
const selectImage = () => {
  fileInputRef.value?.click()
}

// 处理选择的文件
const onFileSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const imageUrl = URL.createObjectURL(file)
    const result = await codeReader.decodeFromImageUrl(imageUrl)
    
    if (result) {
      handleScanResult(result)
    }
  } catch (error) {
    console.error('Image decode failed:', error)
    showToast(t('routes.scan.camera.noQrInImage'))
  } finally {
    // 清空文件选择，以便重复选择同一文件
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 组件挂载时自动开始扫描
onMounted(() => {
  openScan()
})

// 组件卸载时停止扫描
onUnmounted(() => {
  stopScan()
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

// 定义事件
const emit = defineEmits(['success'])

// 添加一个变量记录上一次的扫描结果，避免重复提示
const lastResult = ref('')

// 计算点阵数量和间距
const DOTS_PER_ROW = 18
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// 计算间距 (屏幕宽度减去左右padding后均分)
const gap = computed(() => (windowWidth.value - 40) / (DOTS_PER_ROW - 1)) // 40px 是左右各20px的padding

// 计算可容纳的行数 (屏幕高度减去上下padding后，按相同间距划分)
const totalRows = computed(() => Math.floor((windowHeight.value - 40) / gap.value) + 1)
const totalDots = computed(() => DOTS_PER_ROW * totalRows.value)

// 监听窗口大小变化
onMounted(() => {

  setupCanvas()

  const handleResize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight,
    setupCanvas()
  }
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

// 添加重新开始扫描的方法
const restartScan = () => {
  isResultShowing.value = false
  lastFrameUrl.value = ''
  lastResult.value = ''
  openScan()
}
</script>

<template>
  <div class="relative h-screen overflow-hidden flex items-center justify-center bg-black">
    <!-- 点阵背景 -->
    <div class="dot-matrix absolute inset-0 z-1">
      <div v-for="i in totalDots" :key="i" class="dot"></div>
    </div>
    
    <!-- 视频/结果显示区域 -->
    <template v-if="!isResultShowing">
      <video
        id="qrcode-scanner"
        class="h-full w-full object-cover absolute left-0 top-0"
      ></video>
    </template>
    <template v-else>
      <img 
        :src="lastFrameUrl" 
        class="h-full w-full object-cover absolute left-0 top-0"
      />
    </template>
    
    <!-- Canvas 定位层 -->
    <canvas
      ref="overlayRef"
      class="absolute left-0 top-0 w-full h-full"
    ></canvas>
    
    <!-- 扫描动画仅在扫描时显示 -->
    <div v-if="!isResultShowing" class="h-full w-full absolute left-0 top-0 overflow-hidden">
      <div class="scanning absolute inset-x-0 z-2 h-126px"></div>
    </div>

    <!-- loading加载 -->
    <div v-if="loading" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
      loading...
    </div>
    
    <!-- 异常信息 -->
    <div v-if="errorText" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
      {{ errorText }}
    </div>
    
    <!-- 底部按钮组 -->
    <div class="fixed bottom-16px left-0 right-0 flex justify-between px-16px">
      <!-- 当显示结果时显示重新扫描按钮 -->
      <template v-if="isResultShowing">
        <button 
          type="button" 
          class="w-44px h-44px rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors duration-300 flex items-center justify-center cursor-pointer"
          @click="restartScan"
        >
          <div class="i-carbon-scan text-24px text-white"></div>
        </button>
      </template>
      <template v-else>
        <!-- 手电筒 -->
        <button 
          type="button" 
          class="w-44px h-44px rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors duration-300 flex items-center justify-center cursor-pointer"
          @click="toggleTorch"
        >

          <FlashlightSvg class="w-24px h-24px" :class="{ 'text-yellow-400': isTorchOn }"></FlashlightSvg>

          <!-- <div class="i-carbon-flash text-24px text-white" :class="{ 'text-yellow-400': isTorchOn }"></div> -->
        </button>

        <!-- Cambiar cámara (frontal/trasera). Solo si hay más de una. -->
        <button
          v-if="cameras.length > 1"
          type="button"
          class="w-44px h-44px rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors duration-300 flex items-center justify-center cursor-pointer"
          :aria-label="t('routes.scan.camera.switch')"
          @click="switchCamera"
        >
          <div class="i-carbon-renew text-24px text-white"></div>
        </button>

        <!-- 相册 -->
        <button
          type="button"
          class="w-44px h-44px rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors duration-300 flex items-center justify-center cursor-pointer"
          @click="selectImage"
        >
          <!-- <div class="i-carbon-image text-24px text-white"></div> -->
          <PictureSvg class="w-24px h-24px "></PictureSvg>
        </button>
      </template>
    </div>

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileSelected"
    >
  </div>
</template>

<style scoped>
.scanning {
  background: linear-gradient(
    rgba(255, 255, 255, 0),
    80%,
    rgba(var(--primary-color-rgb), 0.8)
  );
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(100vh);
  }
}

canvas {
  transition: all 0.05s ease-out;
  pointer-events: none;
}

/* 添加图标悬停效果 */
button:hover {
  opacity: 0.9;
}

button:active {
  opacity: 0.7;
}

.dot-matrix {
  display: grid;
  grid-template-columns: repeat(18, 1fr);
  gap: v-bind(gap + 'px');
  padding: 10px;
  pointer-events: none;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.dot {
  width: 4px;
  height: 4px;
  background-color: rgba(var(--primary-color-rgb), 0.3);
  border-radius: 50%;
  justify-self: center;
  align-self: center;
}

@keyframes dotPulse {
  0% { opacity: 0.2; }
  50% { opacity: 0.4; }
  100% { opacity: 0.2; }
}

.dot {
  animation: dotPulse 2s infinite;
}

/* 确保点阵在扫描线下方 */
.scanning {
  z-index: 2;
}
</style> 