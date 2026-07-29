import { getCountryByCode } from "@/constants/countries";

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
    // Cantidad de dígitos según el país elegido.
    //
    // Sin esta regla, un número incompleto se mandaba igual al backend y este
    // respondía "Este número no está registrado. ¿Querés crear una cuenta?".
    // El mensaje MIENTE: el número probablemente sí está registrado, solo le
    // falta un dígito — y si el cliente le cree, se crea una cuenta duplicada.
    // Validamos acá para que ni siquiera salga el request y el usuario lea qué
    // le falta, en el campo que corresponde.
    //
    // Se valida con el regex del país (ver src/constants/countries.js) y no con
    // un largo fijo: AR son 10 dígitos, UY 8-9, US 10 con reglas NANP.
    {
      validator: (val) => {
        const digits = String(val || "").replace(/\D/g, "");
        // Vacío lo cubre la regla `required` de arriba; no duplicamos el error.
        if (!digits) return true;

        const country = getCountryByCode(areaCode.value);
        if (country.pattern.test(digits)) return true;

        return country.minLength === country.maxLength
          ? t("routes.auth.validation.phoneDigits", {
              count: country.maxLength,
            })
          : t("routes.auth.validation.phoneDigitsRange", {
              min: country.minLength,
              max: country.maxLength,
            });
      },
    },
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
