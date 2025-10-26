import { Client, GatewayIntentBits } from "discord.js";
import Parser from "rss-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const parser = new Parser({
  customFields: { item: [["media:content", "media", { keepArray: true }]] },
  defaultRSS: 2.0,
  strictXML: false,
});

const {
  DISCORD_TOKEN,
  YT_CHANNEL_ID,
  TIKTOK_USERNAME,
  TWITCH_USER,
  TWITCH_CLIENT_ID,
  TWITCH_ACCESS_TOKEN,
  CHANNEL_DISCORD_AVISOS,
  CHANNEL_DISCORD_STREAM,
} = process.env;

let lastYouTube = null;
let lastTikTok = null;
let isLive = false;

// === 📹 YouTube ===
async function checkYouTube() {
  try {
    const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`);
    if (!feed.items || feed.items.length === 0) return;

    const latest = feed.items[0];
    const channelName = feed.title || "el canal";

    if (!lastYouTube || latest.link !== lastYouTube) {
      lastYouTube = latest.link;
      const channel = await client.channels.fetch(CHANNEL_DISCORD_AVISOS);

      const message = `🌙 @everyone\nEl hechizo del día se ha grabado 📹\n✨ **${latest.title}** acaba de salir en el canal de **${channelName}**\n🪞 Corre a verlo: ${latest.link}`;
      await channel.send({ content: message });

      console.log(`📺 Nuevo video: ${latest.title}`);
    }
  } catch (err) {
    console.error("❌ Error al revisar YouTube:", err.message);
  }
}

// === 🎭 TikTok ===
async function checkTikTok() {
  try {
    const rssUrl = `https://www.tiktok.com/@${TIKTOK_USERNAME}/rss`;
    const response = await fetch(rssUrl);
    const xml = await response.text();
    const match = xml.match(/<link>(https:\/\/www\.tiktok\.com\/@[^<]+)<\/link>/i);

    if (!match || !match[1]) return;

    const latestLink = match[1];
    if (!lastTikTok || latestLink !== lastTikTok) {
      lastTikTok = latestLink;
      const channel = await client.channels.fetch(CHANNEL_DISCORD_AVISOS);

      const message = `💫 ¡Nuevo ritual en movimiento!\n🌙 @everyone\n✨ **${TIKTOK_USERNAME}** acaba de publicar un nuevo clip en TikTok\n🎭 Ven a invocar la risa: ${latestLink}`;
      await channel.send({ content: message });

      console.log(`🎵 Nuevo TikTok: ${latestLink}`);
    }
  } catch (err) {
    console.error("❌ Error al revisar TikTok:", err.message);
  }
}

// === 🟣 Twitch ===
async function checkTwitch() {
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USER}`, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
      },
    });

    const data = await res.json();
    const stream = data.data[0];
    const channel = await client.channels.fetch(CHANNEL_DISCORD_STREAM);

    if (stream && !isLive) {
      isLive = true;

      const message = `🌙 @everyone\nEl portal se ha abierto 💫\n**${TWITCH_USER}** está transmitiendo en Twitch 🕯️\n🎭 **${stream.title}**\n✨ Ven a cruzar el umbral → https://twitch.tv/${TWITCH_USER}`;
      await channel.send({ content: message });

      console.log(`🩸 Stream iniciado: ${stream.title}`);
    } else if (!stream && isLive) {
      isLive = false;
      await channel.send("🕯️ El portal se ha cerrado. Gracias por asistir al ritual 💜");
      console.log("🕯️ Stream finalizado.");
    }
  } catch (err) {
    console.error("❌ Error al revisar Twitch:", err.message);
  }
}

// === LOOP PRINCIPAL ===
client.once("ready", () => {
  console.log(`✅ Blood Moon Secretary conectada como ${client.user.tag}`);

  checkYouTube();
  checkTikTok();
  checkTwitch();

  setInterval(checkYouTube, 5 * 60 * 1000); // 5 min
  setInterval(checkTikTok, 10 * 60 * 1000); // 10 min
  setInterval(checkTwitch, 2 * 60 * 1000); // 2 min
});

client.login(DISCORD_TOKEN);

import "./keepAlive.js";
