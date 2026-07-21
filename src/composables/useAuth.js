// 登录/注册/忘记密码/重置密码
export function useAuth(getVerifyCodeApi) {
  const { t } = useI18n();

  const formRef = useTemplateRef("formRef");
  const countdown = ref(0);
  const areaCode = ref("54"); // 默认阿根廷区号

  const { pause, resume, isActive } = useIntervalFn(
    () => {
      countdown.value--;
      if (countdown.value <= 0) {
        pause();
      }
    },
    1000,
    { immediate: false }
  );

  const countdownButtonText = computed(() =>
    isActive.value
      ? t("routes.auth.messages.codeCountdown", {
          time: countdown.value,
        })
      : t("routes.auth.messages.getCode")
  );

  const smsRequestId = ref(""); // 存储短信请求ID
  const agreement = ref(false);

  const formData = ref({
    phone: "",
    verifyCode: "",
    password: "",
    oldPassword: "",
    confirmPassword: "",
  });

  // 手机号
  const phoneNumber = computed(() => {
    const { phone } = unref(formData);
    return `${areaCode.value}${phone}`;
  });

  // rules
  // 验证手机号
  const phoneRules = [
    {
      required: true,
      message: t("routes.auth.validation.phoneRequired"),
    },
    // 验证手机号格式 - 支持国际号码
    // {
    //   pattern: /^[1-9]\d{1,14}$/,
    //   message: t("routes.auth.validation.phoneFormat"),
    // },
  ];
  // 验证验证码
  const verifyCodeRules = [
    {
      required: true,
      message: t("routes.auth.validation.codeRequired"),
    },
  ];

  // 密码验证规则
  const oldPasswordRules = [
    {
      required: true,
      message: t("routes.auth.validation.oldPasswordRequired"),
    },
  ];

  // 验证密码
  const passwordRules = [
    {
      required: true,
      message: t("routes.auth.validation.passwordRequired"),
    },
    {
      min: 6,
      max: 20,
      message: t("routes.auth.validation.passwordLength"),
    },
  ];

  // 验证确认密码
  const confirmPasswordRules = [
    {
      validator: (val) => {
        if (val !== formData.value.password) {
          return t("routes.auth.validation.passwordMismatch");
        }
        return true;
      },
    },
  ];

  // 获取验证码
  const getVerifyCode = async () => {
    if (!getVerifyCodeApi) return;

    // validate
    await formRef.value.validate("phone");

    const { data, error } = await getVerifyCodeApi({
      phoneNum: phoneNumber.value,
    });
    if (unref(error)) {
      showToast(unref(error));
      return;
    }
    smsRequestId.value = unref(data).smsRequestId;
    showToast(t("routes.auth.messages.codeSent"));
    countdown.value = 60;
    resume();
  };

  return {
    areaCode,
    formRef,
    formData,
    phoneNumber,
    countdownButtonText,
    isActive,
    getVerifyCode,
    smsRequestId,
    agreement,
    oldPasswordRules,
    phoneRules,
    verifyCodeRules,
    passwordRules,
    confirmPasswordRules,
  };
}
