import api from "./client";

// سبد خرید (فقط role=user / role=student، هر دو با اکانت نوع "user" وارد می‌شن)
export async function fetchMyCart() {
  const { data } = await api.get("/user-panel/cart");
  return data.data; // { items, total }
}

export async function addToCart(item_type, item_id) {
  const { data } = await api.post("/user-panel/cart", { item_type, item_id });
  return data;
}

export async function removeFromCart(cartItemId) {
  const { data } = await api.delete(`/user-panel/cart/${cartItemId}`);
  return data;
}

export async function checkoutCart() {
  const { data } = await api.post("/user-panel/cart/checkout");
  return data;
}
