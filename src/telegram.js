const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});

const BUTTONS = {
  property: "🏠 ثبت ملک جدید",
  file: "📎 ارسال فایل",
  commission: "🧮 محاسبه کمیسیون",
  cancel: "❌ لغو"
};

export function telegramMenu() {
  return {
    keyboard: [[{ text: BUTTONS.property }, { text: BUTTONS.file }], [{ text: BUTTONS.commission }]],
    resize_keyboard: true,
    is_persistent: true
  };
}

export function commission({ rent = 0, monthly = 0 }) {
  const deposit = Number(rent) || 0;
  const monthlyRent = Number(monthly) || 0;
  const depositFee = deposit <= 50000000 ? deposit * 0.02 : 50000000 * 0.02 + (deposit - 50000000) * 0.01;
  const rentFee = (monthlyRent * 2) / 3;
  const total = Math.round(depositFee + rentFee);
  return { depositFee: Math.round(depositFee), rentFee: Math.round(rentFee), total, eachParty: Math.round(total / 2) };
}

export function propertyFields() {
  return ["title", "dealType", "propertyType", "price", "rent", "area", "rooms", "location", "phone", "description", "photo"];
}

async function telegram(token, method, body) {
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.description || "Telegram request failed");
  return data;
}

export async function sendTelegramMessage(env, chatId, text, replyMarkup = telegramMenu()) {
  return telegram(env.TELEGRAM_BOT_TOKEN, "sendMessage", { chat_id: chatId, text, reply_markup: replyMarkup });
}

export async function sendTelegramPhoto(env, chatId, photo, caption) {
  return telegram(env.TELEGRAM_BOT_TOKEN, "sendPhoto", { chat_id: chatId, photo, caption });
}

export async function handleTelegramWebhook(request, env) {
  const update = await request.json();
  const message = update.message;
  if (!message?.chat?.id) return json({ ok: true });
  const chatId = message.chat.id;
  const text = String(message.text || "").trim();
  const groupUrl = env.TELEGRAM_GROUP_URL || "";
  const groupTitle = env.TELEGRAM_GROUP_TITLE || "گروه مشاورین املاک اخلاصی";

  if (text === "/start") {
    const intro = `به سامانه املاک اخلاصی خوش آمدید.\n\n${groupTitle}\n${groupUrl || "لینک گروه از بخش مدیریت تنظیم شود."}\n\nاز منوی زیر گزینه موردنظر را انتخاب کنید.`;
    return sendTelegramMessage(env, chatId, intro);
  }
  if (text === BUTTONS.commission) {
    return sendTelegramMessage(env, chatId, "برای محاسبه کمیسیون، مبلغ رهن و اجاره ماهانه را با این قالب بفرستید:\nرهن: 50000000\nاجاره: 5000000");
  }
  if (text === BUTTONS.property) {
    return sendTelegramMessage(env, chatId, "ثبت ملک جدید\nعنوان، نوع معامله، نوع ملک، قیمت/رهن، اجاره، متراژ، اتاق، منطقه، شماره تماس، توضیحات و سپس عکس را ارسال کنید.");
  }
  if (text === BUTTONS.file) {
    return sendTelegramMessage(env, chatId, "فایل یا عکس را ارسال کنید. عنوان و توضیح فایل را نیز در پیام همراه بنویسید.");
  }
  const match = text.match(/رهن\s*[:：]?\s*([\d۰-۹,،]+)[\s\n]+اجاره\s*[:：]?\s*([\d۰-۹,،]+)/i);
  if (match) {
    const normalize = value => Number(String(value).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[،,]/g, ""));
    const result = commission({ rent: normalize(match[1]), monthly: normalize(match[2]) });
    return sendTelegramMessage(env, chatId, `نتیجه محاسبه کمیسیون:\nکل کمیسیون: ${result.total.toLocaleString("fa-IR")} تومان\nسهم هر طرف: ${result.eachParty.toLocaleString("fa-IR")} تومان`);
  }
  return sendTelegramMessage(env, chatId, "گزینه موردنظر را از منوی دکمه‌ای انتخاب کنید.");
}

export { json };
