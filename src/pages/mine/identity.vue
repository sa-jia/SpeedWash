<script setup>
import { storeToRefs } from "pinia";
const { t } = useI18n();
const router = useRouter();
const membershipStore = useMembershipStore();

const { memberships, loading, error, applicableMemberships } =
  storeToRefs(membershipStore);
const { getMemberships, getStatusText, checkStatus, setCurrentMembership } =
  membershipStore;

// 页面加载时获取身份列表
onMounted(getMemberships);

// 获取标签样式
const getLabelClass = (type) => {
  const classMap = {
    DOCTOR: "bg-[#6B7FF7] text-white",
    DRIVER: "bg-[#4CD263] text-white",
  };
  return `px-3 py-1 rounded-md text-sm ${
    classMap[type] || "bg-gray-500 text-white"
  }`;
};

// 点击身份项
const handleItemClick = (item) => {
  if (checkStatus(item)) return;
  setCurrentMembership(item);
  const query = Object.fromEntries(
    Object.entries({
      type: item.membershipType,
      licenseNo: item.licenseNo,
      imgUrl: item.imgUrl,
    }).map(([key, value]) => [key, encodeURIComponent(value || "")])
  );
  router.push({
    path: "/verify",
    query,
  });
};

// 添加新身份
const handleAddNew = () => {
  setCurrentMembership(null);
  router.push("/verify");
};
</script>

<template>
  <!-- 加载状态 -->
  <div v-if="loading" class="p-4 text-center">
    <van-loading type="spinner" />
  </div>

  <!-- 错误提示 -->
  <div v-else-if="error" class="p-4 text-center text-red-500">
    {{ error }}
  </div>

  <!-- 身份列表 -->
  <div v-else class="space-y-4">
    <van-cell-group
      v-for="item in memberships"
      :key="item.membershipType"
      inset
    >
      <van-cell
        :value="getStatusText(item.checkStatus)"
        is-link
        @click="handleItemClick(item)"
      >
        <template #title>
          <van-tag type="primary" size="large">{{
            item.membershipType
          }}</van-tag>
        </template>
      </van-cell>
    </van-cell-group>

    <div
      v-if="false"
      v-for="item in memberships"
      :key="item.type"
      class="flex items-center justify-between bg-white rounded-lg p-4"
      @click="handleItemClick(item)"
    >
      <div class="flex items-center">
        <span :class="getLabelClass(item.type)">{{
          getTypeText(item.type)
        }}</span>
      </div>
      <div class="flex items-center">
        <span class="text-[#333] mr-2">{{ getStatusText(item.status) }}</span>
        <van-icon v-if="item.status === 1" name="arrow" class="text-[#999]" />
      </div>
    </div>
  </div>

  <!-- 底部按钮 -->
  <van-action-bar>
    <van-action-bar-button
      type="primary"
      @click="handleAddNew"
      icon="add-o"
      :disabled="applicableMemberships.length <= 0"
    >
      {{ t("routes.identity.addNew") }}
    </van-action-bar-button>
  </van-action-bar>
</template>

<style scoped>
/* .identity {
  min-height: 100vh;
  background: #f7f8fa;
} */

.van-cell-group {
  margin-top: 12px;
}
</style>
