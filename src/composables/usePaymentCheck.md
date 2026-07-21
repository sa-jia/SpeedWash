解析 Stripe 支付完成后的 return_url。

当用户完成 Stripe 支付后会被重定向到指定的 return_url，这个 URL 会包含一些重要的查询参数。主要有两种处理方式:

1. 使用 URL 参数解析:
```javascript
const urlParams = new URLSearchParams(window.location.search);
const paymentIntentId = urlParams.get('payment_intent');
const paymentStatus = urlParams.get('redirect_status');

// 检查支付状态
if (paymentStatus === 'succeeded') {
  // 支付成功
} else if (paymentStatus === 'failed') {
  // 支付失败
}
```

2. 使用 Stripe 客户端库检查状态:
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('your_publishable_key');

// 获取 payment_intent 参数
const clientSecret = new URLSearchParams(window.location.search).get(
  'payment_intent_client_secret'
);

if (clientSecret) {
  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
  
  switch (paymentIntent.status) {
    case 'succeeded':
      // 支付成功
      break;
    case 'processing':
      // 支付处理中
      break;
    case 'requires_payment_method':
      // 支付失败,需要重试
      break;
    default:
      // 其他状态处理
      break;
  }
}
```

TODO:

1. 最好使用第二种方式(Stripe 客户端库),因为它可以获取更详细的支付状态信息

2. 记得处理各种异常情况,比如参数缺失、网络错误等

3. 支付成功后,最好再调用自己的后端 API 确认订单状态,因为有可能出现前端显示成功但实际支付失败的情况

4. 可以结合 loading 状态来优化用户体验,比如在检查支付状态时显示加载提示