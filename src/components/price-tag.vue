<script setup>
const { centsToSGD } = useCurrency()

const props = defineProps({
  // 金额
  price: {
    type: [Number, String],
    required: true,
    default: 0,
  },
  // 货币符号 (默认阿根廷比索 $)
  currency: {
    type: String,
    default: "$",
  },
  // 是否显示货币符号
  showCurrency: {
    type: Boolean,
    default: true,
  },
  // 小数位数
  decimals: {
    type: Number,
    default: 2,
  },
  // 是否使用千分位分隔
  thousands: {
    type: Boolean,
    default: false,
  },
  // 是否显示正负号
  showSign: {
    type: Boolean,
    default: false,
  },
  // 是否进行分转元的转换
  convertCents: {
    type: Boolean,
    default: true,
  },
  // 货币符号样式
  currencyClass: {
    type: String,
    default: "",
  },
  // 整数部分样式
  integerClass: {
    type: String,
    default: "",
  },
  // 小数部分样式
  decimalClass: {
    type: String,
    default: "",
  },
});

// 格式化后的价格各部分
const parts = computed(() => {
  const amount = props.convertCents ? centsToSGD(props.price) : Number(props.price || 0);
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // 分离整数和小数
  let [integer, decimal = ""] = absAmount.toFixed(props.decimals).split(".");

  // 添加千分位分隔 (formato AR: punto como separador de miles)
  if (props.thousands) {
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // 处理正负号
  const sign = isNegative ? "-" : props.showSign ? "+" : "";

  return {
    sign,
    integer,
    decimal: decimal ? `.${decimal}` : "",
  };
});
</script>

<template>
  <div class="inline-flex items-baseline">
    <!-- 货币符号 -->
    <span v-if="showCurrency" :class="currencyClass">
      {{ currency }}
    </span>

    <!-- 正负号和整数部分 -->
    <span :class="integerClass"> {{ parts.sign }}{{ parts.integer }} </span>

    <!-- 小数部分 -->
    <span v-if="decimals > 0" :class="decimalClass">
      {{ parts.decimal }}
    </span>
  </div>
</template>
