import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";

const generateGuestId = () => {
  return "guest_" + uuidv4();
};

export const useUserStore = defineStore("user", () => {
  const guestId = useStorage("guestId", null);
  const token = useStorage("token", "");
  const userInfo = useStorage("userInfo", {
    token: "",
    phoneNum: "",
    nickName: "",
  });

  const isLogin = computed(() => {
    return token.value || guestId.value;
  });

  const isGuest = computed(() => {
    return !token.value && guestId.value;
  });

  const isRegistered = computed(() => {
    return token.value;
  });


  // 访客登录
  function guestLogin() {
    guestId.value = generateGuestId();
  }

  function getToken() {
    const user = unref(userInfo);
    if (!user) return null;
    return user.token;
  }

  const setToken = (newToken) => {
    token.value = newToken;
  };

  const setUserInfo = (info) => {
    userInfo.value = info;
    setToken(info.token);
    if (info.token) {
      guestId.value = null;
    }
  };

  const clearUserInfo = () => {
    token.value = "";
    userInfo.value = null;
  };

  const logout = () => {
    clearUserInfo();
  };

  return {
    token,
    userInfo,
    getToken,
    setToken,
    setUserInfo,
    clearUserInfo,
    guestLogin,
    isGuest,
    isRegistered,
    isLogin,
    logout,
  };
});
