import { getImageUrl } from "@/utils";

export function useUpload(options) {
  const { type } = options;
  const fileList = ref([]);

  const urlList = computed(() => {
    return fileList.value.map((item) => getImageUrl(item.url));
  });

  const downloadUrlMap = ref({});

  async function oneAfterRead(fileData) {
    const { file } = fileData;
    try {
      // 获取上传凭证
      const { data, error } = await fileApi.getUploadKey({
        type,
        // 重命名文件名, 生成唯一文件名
        filename: file.name,
      });

      if (unref(error)) throw error;

      const { downloadUrl, formData: resFormData } = unref(data);

      // 上传文件
      const uploadFormData = new FormData();
      resFormData.forEach((item) => {
        uploadFormData.append(item.key, item.value);
      });
      uploadFormData.append("file", file);

      const { error: uploadError } = await fileApi.upload(uploadFormData);

      if (unref(uploadError)) throw uploadError;

      downloadUrlMap.value[file.name] = downloadUrl;
      fileData.url = getImageUrl(downloadUrl);

      // 保存图片URL
      // formData.imgUrl = getImageUrl(downloadUrl);
    } catch (err) {
      fileData.status = "failed";
      fileData.message = "上传失败";
    }
  }

  async function afterRead(data) {
    // 判断是否是多选
    if (Array.isArray(data)) {
      data.forEach(async (item) => {
        await oneAfterRead(item);
      });
    } else {
      await oneAfterRead(data);
    }
  }
  return {
    fileList,
    urlList,
    downloadUrlMap,
    afterRead,
  };
}
