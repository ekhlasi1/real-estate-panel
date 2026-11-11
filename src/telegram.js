const SETTINGS_KEY = "telegram_settings";
const BUTTONS = { property: "🏠 ثبت ملک جدید", file: "📎 ارسال فایل", commission: "🧮 محاسبه کمیسیون", cancel: "❌ لغو" };
const FIELDS = [
  ["title", "عنوان ملک"], ["dealType", "نوع معامله"], ["propertyType", "نوع ملک"],
  ["price", "قیمت"], ["rent", "رهن"], ["monthlyRent", "اجاره"], ["area", "متراژ"],
  ["rooms", "تعداد اتاق"], ["location", "منطقه"], ["phone", "شماره تماس مشاور"], ["description", "توضیحات"]
];
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const stateKey = id => `telegram_state:${id}`;
const digits = value => Number(String(value).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[،,]/g, "").trim()) || 0;

export function telegramMenu() { return { keyboard: [[{ text: BUTTONS.property }, { text: BUTTONS.file }], [{ text: BUTTONS.commission }, { text: BUTTONS.cancel }]], resize_keyboard: true, is_persistent: true }; }
export function commission({ rent = 0, monthly = 0 }) { const deposit = Number(rent) || 0; const monthlyRent = Number(monthly) || 0; const depositFee = deposit <= 50000000 ? deposit * .02 : 50000000 * .02 + (deposit - 50000000) * .01; const rentFee = monthlyRent * 2 / 3; const total = Math.round(depositFee + rentFee); return { depositFee: Math.round(depositFee), rentFee: Math.round(rentFee), total, eachParty: Math.round(total / 2) }; }
export function propertyFields() { return ["title", "dealType", "propertyType", "price", "rent", "area", "rooms", "location", "phone", "description", "photo"]; }

async function callTelegram(env, method, body) { if (!env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not configured"); const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok || !result.ok) throw new Error(result.description || "Telegram request failed"); return result; }
export const sendTelegramMessage = (env, chatId, text, replyMarkup = telegramMenu()) => callTelegram(env, "sendMessage", { chat_id: chatId, text, reply_markup: replyMarkup });
export const sendTelegramPhoto = (env, chatId, photo, caption) => callTelegram(env, "sendPhoto", { chat_id: chatId, photo, caption });

const settings = async env => (await env.KV?.get(SETTINGS_KEY, "json")) || {};
const admins = value => String(value || "").split(/[\s,،]+/).map(Number).filter(Boolean);
const summary = property => FIELDS.map(([key, label]) => `${label}: ${property[key] || "-"}`).join("\n");
async function notify(env, config, text, media) { await Promise.all(admins(config.adminIds).map(async id => { await sendTelegramMessage(env, id, text); if (media?.type === "photo") await sendTelegramPhoto(env, id, media.id, "عکس ملک جدید"); if (media?.type === "document") await callTelegram(env, "sendDocument", { chat_id: id, document: media.id, caption: "فایل جدید" }); })); }
async function ask(env, chatId, index) { return sendTelegramMessage(env, chatId, FIELDS[index]?.[1] || "عکس ملک را ارسال کنید (اختیاری)."); }

export async function handleTelegramWebhook(request, env) {
  const update = await request.json(); const message = update.message; if (!message?.chat?.id) return json({ ok: true });
  const chatId = message.chat.id; const config = await settings(env); const text = String(message.text || "").trim();
  const groupTitle = config.groupTitle || env.TELEGRAM_GROUP_TITLE || "گروه مشاورین املاک اخلاصی"; const groupUrl = config.groupUrl || env.TELEGRAM_GROUP_URL || "";
  if (text === "/start") return sendTelegramMessage(env, chatId, `به سامانه املاک اخلاصی خوش آمدید.\n\n${groupTitle}\n${groupUrl || "لینک گروه از بخش مدیریت تنظیم شود."}\n\nاز منوی زیر انتخاب کنید.`);
  if (text === BUTTONS.cancel) { await env.KV?.delete(stateKey(chatId)); return sendTelegramMessage(env, chatId, "عملیات لغو شد."); }
  if (text === BUTTONS.commission) return sendTelegramMessage(env, chatId, "مبلغ رهن و اجاره را ارسال کنید:\nرهن: 50000000\nاجاره: 5000000");
  const match = text.match(/رهن\s*[:：]?\s*([\d۰-۹,،]+)[\s\n]+اجاره\s*[:：]?\s*([\d۰-۹,،]+)/i); if (match) { const result = commission({ rent: digits(match[1]), monthly: digits(match[2]) }); return sendTelegramMessage(env, chatId, `نتیجه محاسبه کمیسیون:\nکل کمیسیون: ${result.total.toLocaleString("fa-IR")} تومان\nسهم هر طرف: ${result.eachParty.toLocaleString("fa-IR")} تومان`); }
  if (text === BUTTONS.property) { await env.KV?.put(stateKey(chatId), JSON.stringify({ index: 0, property: {} }), { expirationTtl: 86400 }); return sendTelegramMessage(env, chatId, `ثبت ملک جدید\n${FIELDS[0][1]}`); }
  if (text === BUTTONS.file) return sendTelegramMessage(env, chatId, "فایل یا عکس را ارسال کنید؛ برای مدیران ربات فرستاده می‌شود.");
  const state = await env.KV?.get(stateKey(chatId), "json");
  if (state) {
    const field = FIELDS[state.index]; if (field) { state.property[field[0]] = text || "-"; state.index += 1; await env.KV.put(stateKey(chatId), JSON.stringify(state), { expirationTtl: 86400 }); return ask(env, chatId, state.index); }
    const photo = message.photo?.at(-1)?.file_id || ""; const property = { ...state.property, photo, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; await env.KV.put(`property:${property.id}`, JSON.stringify(property)); await env.KV.delete(stateKey(chatId)); await notify(env, config, `ملک جدید ثبت شد\n\n${summary(property)}`, photo ? { type: "photo", id: photo } : null); return sendTelegramMessage(env, chatId, "ملک با موفقیت ثبت و برای مدیران ارسال شد.");
  }
  const media = message.photo?.length ? { type: "photo", id: message.photo.at(-1).file_id } : message.document?.file_id ? { type: "document", id: message.document.file_id } : null;
  if (media) { await notify(env, config, "رسانه جدید از ربات دریافت شد.", media); return sendTelegramMessage(env, chatId, "فایل برای مدیران ارسال شد."); }
  return sendTelegramMessage(env, chatId, "گزینه موردنظر را از منوی دکمه‌ای انتخاب کنید.");
}

export { json };
