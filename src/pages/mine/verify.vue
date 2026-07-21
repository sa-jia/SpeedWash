<script setup>
import { storeToRefs } from "pinia";
import { getImageUrl } from "@/utils";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const membershipStore = useMembershipStore();
const router = useRouter();
const route = useRoute();

const { type, licenseNo, imgUrl } = Object.fromEntries(
  Object.entries(route.query).map(([key, value]) => [
    key,
    decodeURIComponent(value || ""),
  ])
);

// 获取当前要认证的身份
const {
  memberships,
  loading,
  error,
  applicableMemberships,
  currentMembership,
} = storeToRefs(membershipStore);

const { applyMembership, getMemberships } = membershipStore;
getMemberships();

// 如果没有选择要认证的身份，返回上一页
// if (!currentMembership.value) {
//   router.back()
// }

// 是否只读
const readOnly = computed(() =>
  [1, 99].includes(currentMembership.value?.checkStatus)
);

// 是否同意
const agree = ref(false);

// 添加一个计算属性用于控制表单禁用状态
const formDisabled = computed(() => readOnly.value || loading.value);
const showAgree = computed(() => !currentMembership.value?.checkStatus);

// 表单数据
const formData = reactive({
  membershipType: type,
  licenseNo, // 证件号
  imgUrl: getImageUrl(imgUrl),
});

const images = ref(
  formData.imgUrl
    ? [
        {
          url: formData.imgUrl,
        },
      ]
    : []
);

// 身份类型选择器
const showPicker = ref(false);
const pickerValue = ref(
  formData.membershipType ? [formData.membershipType] : []
);

const columns = computed(() => {
  return applicableMemberships.value.map((item) => ({
    text: item,
    value: item,
  }));
});

const onConfirm = ({ selectedValues, selectedOptions }) => {
  showPicker.value = false;
  pickerValue.value = selectedValues;
  formData.membershipType = selectedOptions[0].text;
};

// 简化后的上传处理函数
const handleAfterRead = async ({ file }) => {
  try {
    const { data, error } = await fileApi.getUploadKey({
      type: "MEMBERSHIP",
      filename: file.name,
    });

    if (unref(error)) throw error;

    const { downloadUrl, formData: resFormData } = unref(data);

    const uploadFormData = new FormData();
    resFormData.forEach((item) => {
      uploadFormData.append(item.key, item.value);
    });
    uploadFormData.append("file", file);

    const { error: uploadError } = await fileApi.upload(uploadFormData);

    if (unref(uploadError)) throw uploadError;
    formData.imgUrl = getImageUrl(downloadUrl);
    showSuccessToast(t('common.upload.success'));
  } catch (err) {
    showFailToast(t('common.upload.failed'));
  }
};

// 提交认证
const handleSubmit = () => {

  // 验证表单
  if (showAgree.value && !agree.value) {
    showFailToast(t('routes.verify.validation.agreeTerms'))
    return
  }

  applyMembership(formData)
};
</script>

<template>
  <!-- 审核未通过提示 -->
  <div class="grid grid-center mt-20px" v-if="currentMembership?.checkStatus === 2">
    <div class="text-3xl font-bold">{{ t('routes.verify.rejected') }}</div>
    <div class="text-2xl text-primary mt-10px">
      {{ currentMembership?.denyReason }}
    </div>
  </div>

  <van-form @submit="handleSubmit">
    <van-cell-group inset class="!mt-20px">
      <!-- 身份类型 -->
      <van-field v-model="formData.membershipType" is-link readonly
        :rules="[{ required: true, message: t('routes.verify.validation.selectType') }]" :disabled="formDisabled"
        :label="t('routes.verify.membership')" :placeholder="t('routes.verify.validation.selectType')"
        @click="!formDisabled && (showPicker = true)" />

      <!-- 证件号 -->
      <van-field v-model="formData.licenseNo" :label="t('routes.verify.memberLicenseNo')" :readonly="formDisabled"
        :placeholder="t('routes.verify.validation.enterNo')"
        :rules="[{ required: true, message: t('routes.verify.validation.enterNo') }]" />

      <!-- 文件上传 -->
      <van-field name="uploader" :label="t('routes.verify.uploadCard')"
        :rules="[{ required: true, message: t('routes.verify.validation.uploadPhoto') }]">
        <template #input>
          <app-uploader v-model="images" :max-count="1" :disabled="formDisabled" :after-read="handleAfterRead"
            :deletable="!formDisabled" />
        </template>
      </van-field>

      <!-- 温馨提示 -->
      <van-field :label="t('routes.verify.submissionRequirements')">
        <template #input>
          <div class="flex flex-col">
            <span>{{ t('routes.verify.pleaseUpload') }}</span>
            <span>{{ t('routes.verify.membershipCard') }}</span>
            <span>{{ t('routes.verify.vocationalLicense') }}</span>
            <span>{{ t('routes.verify.rideHailingApp') }}</span>
          </div>
        </template>
      </van-field>
    </van-cell-group>

    <!-- 提交按钮 -->
    <van-action-bar v-if="!formDisabled">
      <van-action-bar-button type="primary" native-type="submit" :disabled="showAgree && !agree">
        {{ t('routes.verify.submit') }}
      </van-action-bar-button>
    </van-action-bar>
  </van-form>

  <!-- 同意条款 -->
  <div class="fixed bottom-safe-50 text-xl w-full" v-if="showAgree">
    <van-field name="agree">
      <template #input>
        <van-checkbox v-model="agree" shape="square">
          {{ t('routes.verify.agreement') }}
        </van-checkbox>
      </template>
    </van-field>
  </div>

  <!-- 选择器弹窗 -->
  <van-popup v-model:show="showPicker" destroy-on-close round position="bottom">
    <van-picker :model-value="pickerValue" :columns="columns" @cancel="showPicker = false"
      @confirm="onConfirm" />
  </van-popup>
</template>

<style scoped>
</style>
