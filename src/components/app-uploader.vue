<script setup>
const modelValue = defineModel('modelValue', {
  type: Array,
  default: () => []
});

const props = defineProps({
  maxCount: {
    type: Number,
    default: 1
  },
  multiple: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  deletable: {
    type: Boolean,
    default: true
  },
  beforeRead: {
    type: Function,
    default: null
  },
  afterRead: {
    type: Function,
    required: true
  },
  compress: {
    type: Boolean,
    default: true
  },
  maxSize: {
    type: Number,
    default: 380
  }
});

// 图片压缩函数
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        const maxSize = props.maxSize * 1024; // 转换为字节
        const initialQuality = 0.9;
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        let quality = initialQuality;
        let compression = canvas.toDataURL('image/jpeg', quality);
        
        while (compression.length > maxSize && quality > 0.1) {
          quality -= 0.1;
          compression = canvas.toDataURL('image/jpeg', quality);
        }
        
        const binaryStr = atob(compression.split(',')[1]);
        const arr = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          arr[i] = binaryStr.charCodeAt(i);
        }
        const compressedFile = new File([arr], file.name, { type: 'image/jpeg' });
        resolve(compressedFile);
      };
    };
  });
};

// 处理 beforeRead
const handleBeforeRead = compressImage;
</script>

<template>
  <van-uploader
    v-model="modelValue"
    :max-count="maxCount"
    :multiple="multiple"
    :disabled="disabled"
    :deletable="deletable"
    :before-read="handleBeforeRead"
    :after-read="afterRead"
  >
    <template #default v-if="$slots.default">
      <slot />
    </template>
  </van-uploader>
</template>
