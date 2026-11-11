import test from "node:test";
import assert from "node:assert/strict";
import { commission, propertyFields, telegramMenu } from "../src/telegram.js";

test("commission calculates both parties", () => {
  const result = commission({ rent: 50000000, monthly: 5000000 });
  assert.equal(result.depositFee, 1000000);
  assert.equal(result.rentFee, 3333333);
  assert.equal(result.eachParty, 2166667);
});

test("property fields match the website workflow", () => {
  assert.deepEqual(propertyFields(), ["title", "dealType", "propertyType", "price", "rent", "area", "rooms", "location", "phone", "description", "photo"]);
});

test("Telegram menu is button based", () => {
  const menu = telegramMenu();
  assert.equal(menu.resize_keyboard, true);
  assert.equal(menu.keyboard.length, 2);
});
