const { Checkout, Charge, User } = require("../models");
const { createPayment, verifyPayment } = require("../services/zarinpal");
const configs = require("../configs");

// بعد از پرداخت (موفق یا ناموفق)، کاربر رو به صفحه‌ی کیف پول در پنل ریکت با یک
// پارامتر وضعیت برمی‌گردونیم؛ به‌جای اینکه فقط یک JSON خام جلوی چشمش بیاد.
// توجه: فرانت با react-router (مسیر واقعی /panel/wallet) کار می‌کنه، نه هش (#wallet).
const FRONTEND_WALLET_URL = `${configs.domain || "http://localhost:5173"}/panel/wallet`;
function redirectToWallet(response, status, message){
  const qs = new URLSearchParams({ payment: status, message: message || "" }).toString();
  return response.redirect(`${FRONTEND_WALLET_URL}?${qs}`);
}

exports.createCheckout = async (request, response) => {
  try {
    const user = request.user;
    const { amount } = request.body;

    if (!amount || isNaN(amount) || amount <= 0)
      return response.status(400).json({
        success: false,
        message: "مبلغ نامعتبر است",
      });

    const newCheckout = await Checkout.create({
      user_id: user.id,
      amount,
    });

    const payment = await createPayment({
      amountInRial: amount,
      description: `سفارش با شناسه ${newCheckout.id}`,
      mobile: user.student_number,
    });

    newCheckout.authority = payment.authority;
    await newCheckout.save();

    return response.status(201).json({
      success: true,
      message: "سبد پرداخت با موفقیت ساخته شد.",
      checkout: newCheckout,
      paymentUrl: payment.paymentUrl,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "خطا در ساخت سبد پرداخت!",
      error: error.message,
    });
  }
};

exports.verifyCheckout = async (request, response) => {
  try {
    const { Status, Authority: authority } = request.query;

    if (Status !== "OK") {
      return redirectToWallet(response, "cancelled", "پرداخت توسط کاربر لغو شد.");
    }

    const alreadyCreatedCharge = await Charge.findOne({ where: { authority } });
    if (alreadyCreatedCharge)
      return redirectToWallet(response, "failed", "این پرداخت قبلاً تایید شده است.");

    const checkout = await Checkout.findOne({ where: { authority } });
    if (!checkout)
      return redirectToWallet(response, "failed", "سبد پرداخت یافت نشد.");

    const payment = await verifyPayment({
      authority,
      amountInRial: checkout.amount,
    });

    if (![100, 101].includes(payment?.data?.code))
      return redirectToWallet(response, "failed", "پرداخت تایید نشد.");

    const charge = await Charge.create({
      user_id: checkout.user_id,
      charge_amount: checkout.amount,
      authority: checkout.authority,
    });

    // به‌روزرسانی موجودی کیف پول کاربر
    const user = await User.findOne({ where: { id: checkout.user_id } });
    if (user) {
      await user.update({
        charge_amount: user.charge_amount + checkout.amount,
      });
    }

    await checkout.destroy();

    return redirectToWallet(response, "success", "کیف پول با موفقیت شارژ شد.");
  } catch (error) {
    return redirectToWallet(response, "failed", "خطا در تایید پرداخت.");
  }
};
