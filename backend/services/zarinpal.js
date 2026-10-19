const configs = require("../configs");

exports.createPayment = async function ({ amountInRial, description, mobile }) {
  try {
    const response = await fetch(`${configs.zarinpal.apiBaseUrl}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: configs.zarinpal.merchantId,
        callback_url: configs.zarinpal.callbackUrl,
        amount: amountInRial,
        currency: "IRR",
        description,
        metadata: { mobile },
      }),
    });

    const data = await response.json();

    if (!data?.data?.authority) {
      throw new Error(data?.errors?.message || "خطا در ایجاد پرداخت زرین‌پال");
    }

    return {
      authority: data.data.authority,
      paymentUrl: configs.zarinpal.merchantBaseUrl + data.data.authority,
    };
  } catch (error) {
    throw new Error(error.message || "Zarinpal payment creation failed");
  }
};

exports.verifyPayment = async function ({ amountInRial, authority }) {
  try {
    const response = await fetch(`${configs.zarinpal.apiBaseUrl}/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: configs.zarinpal.merchantId,
        amount: amountInRial,
        authority,
      }),
    });

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw new Error(error.message || "Zarinpal payment verification failed");
  }
};
