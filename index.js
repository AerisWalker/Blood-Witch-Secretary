// 🌙 Blood Moon Secretary — versión Render estable
import "./keepAlive.js"; // 🔁 Mantiene vivo el bot en Render
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import Parser from "rss-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// === ⚙️ Inicialización del cliente de Discord ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// === 🧙 Configuración de entorno ===
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

// === 🎬 YouTube ===
async function checkYouTube() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`
    );

    if (!feed.items?.length) return;

    const latest = feed.items[0];
    if (!lastYouTube || latest.link !== lastYouTube) {
      lastYouTube = latest.link;
      const channel = await client.channels.fetch(CHANNEL_DISCORD_AVISOS);

      const message = {
        content: `🌙 @everyone\nEl hechizo del día se ha grabado 📹\n✨ **${latest.title}** acaba de salir en el canal de **${feed.title}**\n🪞 Corre a verlo: ${latest.link}`,
      };

      await channel.send(message);
      console.log(`📺 Nuevo video detectado: ${latest.title}`);
    } else {
      console.log("📡 Canal de YouTube revisado — sin nuevos videos.");
    }
  } catch (err) {
    console.error("❌ Error al revisar YouTube:", err.message);
  }
}

// === 🎵 TikTok ===
async function checkTikTok() {
  try {
    const rssUrl = `https://www.tiktok.com/@${TIKTOK_USERNAME}/rss`;
    const response = await fetch(rssUrl);
    const xml = await response.text();

    const match = xml.match(
      /<link>(https:\/\/www\.tiktok\.com\/@[^<]+)<\/link>/i
    );

    if (!match || !match[1]) {
      console.log(
        `⚠️ No se pudo extraer enlace del RSS de TikTok (${TIKTOK_USERNAME}).`
      );
      return;
    }

    const latestLink = match[1];
    if (!lastTikTok || latestLink !== lastTikTok) {
      lastTikTok = latestLink;
      const channel = await client.channels.fetch(CHANNEL_DISCORD_AVISOS);

      const message = {
        content: `💫 ¡Nuevo ritual en movimiento!\n🌙 @everyone\n✨ ${TIKTOK_USERNAME} ya está brillando en TikTok\n🎭 Ven a invocar la risa: ${latestLink}`,
      };

      await channel.send(message);
      console.log(`🎵 Nuevo TikTok detectado → ${latestLink}`);
    } else {
      console.log(`📡 TikTok revisado — sin nuevos clips.`);
    }
  } catch (err) {
    console.error("❌ Error al revisar TikTok:", err.message);
  }
}

// === 🟣 Twitch ===
async function checkTwitch() {
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${TWITCH_USER}`,
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${TWITCH_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await res.json();
    const stream = data.data[0];
    const channel = await client.channels.fetch(CHANNEL_DISCORD_STREAM);

    // Cuando inicia el stream
    if (stream && !isLive) {
      isLive = true;

      const message = {
        content: `🌙 @everyone\nEl portal se ha abierto 💫\n**${TWITCH_USER}** está transmitiendo en Twitch 🕯️\n🎭 **${stream.title}**\n✨ Ven a cruzar el umbral → https://twitch.tv/${TWITCH_USER}`,
      };

      await channel.send(message);
      console.log(`🟣 Stream iniciado: ${stream.title}`);
    }

    // Cuando finaliza
    else if (!stream && isLive) {
      isLive = false;
      await channel.send(
        "🕯️ El portal se ha cerrado. Gracias por acompañar la aventura de hoy 💜"
      );
      console.log("🕯️ Stream finalizado — mensaje de despedida enviado.");
    }

    // Sin cambios
    else {
      console.log("📡 Canal de Twitch revisado — sin cambios.");
    }
  } catch (err) {
    console.error("❌ Error al revisar Twitch:", err.message);
  }
}

// === 🩸 LOOP PRINCIPAL ===
client.once("ready", () => {
  console.log(`✅ Blood Moon Secretary conectada como ${client.user.tag}`);

  // Revisiones iniciales
  checkYouTube();
  checkTikTok();
  checkTwitch();

  // Intervalos
  setInterval(checkYouTube, 5 * 60 * 1000);
  setInterval(checkTikTok, 10 * 60 * 1000);
  setInterval(checkTwitch, 2 * 60 * 1000);
});

client.login(DISCORD_TOKEN);
