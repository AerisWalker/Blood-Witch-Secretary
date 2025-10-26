// 🌙 Blood Moon Secretary — versión Render estable y final
import "./keepAlive.js";
import { Client, GatewayIntentBits } from "discord.js";
import Parser from "rss-parser";
import fetch from "node-fetch";
import TikTokSign from "tiktok-signature"; // ✅ Importación correcta
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

// === ⚙️ Configuración del cliente de Discord ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
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

// === 📂 Memoria persistente del último video de YouTube ===
let lastYouTube = null;
const lastFile = "./lastYouTube.txt";
if (fs.existsSync(lastFile)) {
  lastYouTube = fs.readFileSync(lastFile, "utf-8").trim();
  console.log(`📁 Último video recordado: ${lastYouTube}`);
}

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
      fs.writeFileSync(lastFile, latest.link);

      const channel = await client.channels.fetch(CHANNEL_DISCORD_AVISOS);
      await channel.send({
        content: `🌙 @everyone\nEl hechizo del día se ha grabado 📹\n✨ **${latest.title}** acaba de salir en el canal de **${feed.title}**\n🪞 Corre a verlo: ${latest.link}`,
      });
      console.log(`📺 Nuevo video detectado: ${latest.title}`);
    } else {
      console.log("📡 Canal de YouTube revisado — sin nuevos videos.");
    }
  } catch (err) {
    console.error("❌ Error al revisar YouTube:", err.message);
  }
}

// === 🎵 TikTok (scrape sin API ni premium, versión liviana) ===
async function checkTikTok() {
  try {
    const url = `https://www.tiktok.com/@${TIKTOK_USERNAME}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const html = await response.text();

    // busca la URL del último video
    const match = html.match(/https:\/\/www\.tiktok\.com\/@[^/]+\/video\/\d+/);

    if (!match) {
      console.log(`⚠️ No se encontró ningún video en TikTok (${TIKTOK_USERNAME}).`);
      return;
    }

    const latestLink = match[0];
    if (!lastTikTok || latestLink !== lastTikTok) {
      lastTikTok = latestLink;

      const channel = await client.channels.fetch(CHANNEL_DISCORD_AVISOS);
      await channel.send({
        content: `💫 ¡Nuevo ritual en movimiento!\n🌙 @everyone\n✨ **${TIKTOK_USERNAME}** ya está brillando en TikTok\n🎭 Ven a invocar la risa: ${latestLink}`,
      });

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

    if (stream && !isLive) {
      isLive = true;
      await channel.send({
        content: `🌙 @everyone\nEl portal se ha abierto 💫\n**${TWITCH_USER}** está transmitiendo en Twitch 🕯️\n🎭 **${stream.title}**\n✨ Ven a cruzar el umbral → https://twitch.tv/${TWITCH_USER}`,
      });
      console.log(`🟣 Stream iniciado: ${stream.title}`);
    } else if (!stream && isLive) {
      isLive = false;
      await channel.send("🕯️ El portal se ha cerrado. Gracias por acompañar la aventura de hoy 💜");
      console.log("🕯️ Stream finalizado — mensaje de despedida enviado.");
    } else {
      console.log("📡 Canal de Twitch revisado — sin cambios.");
    }
  } catch (err) {
    console.error("❌ Error al revisar Twitch:", err.message);
  }
}

// === 🌙 LOOP PRINCIPAL ===
client.once("clientReady", () => {
  console.log(`✅ Blood Moon Secretary conectada como ${client.user.tag}`);
  checkYouTube();
  checkTikTok();
  checkTwitch();

  setInterval(checkYouTube, 5 * 60 * 1000); // 5 min
  setInterval(checkTikTok, 10 * 60 * 1000); // 10 min
  setInterval(checkTwitch, 2 * 60 * 1000);  // 2 min
});

client.login(DISCORD_TOKEN);



