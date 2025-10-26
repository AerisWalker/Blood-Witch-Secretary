// 🌙 Blood Moon Secretary — versión Render estable con memoria de último video
import "./keepAlive.js"; // 🔁 Mantiene vivo el bot en Render
import { Client, GatewayIntentBits } from "discord.js";
import Parser from "rss-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";
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

// === 🩸 Memoria persistente del último video ===
let lastYouTube = null;
const lastFile = "./lastYouTube.txt";

// Cargar último video guardado si existe
if (fs.existsSync(lastFile)) {
  lastYouTube = fs.readFileSync(lastFile, "utf-8").trim();
  console.log(`📁 Último video recordado: ${lastYouTube}`);
} else {
  console.log("📁 No hay registro previo de video, iniciando desde cero.");
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

    // Si hay un nuevo video
    if (!lastYouTube || latest.link !== lastYouTube) {
      lastYouTube = latest.link;
      fs.writeFileSync(lastFile, latest.link); // 🧠 Guarda el nuevo enlace

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

// === 🎵 TikTok (modo reforzado con RSSHub) ===
async function checkTikTok() {
  try {
    // Usamos RSSHub para evitar bloqueos del feed original
    const rssUrl = `https://rsshub.app/tiktok/user/${TIKTOK_USERNAME}`;
    const response = await fetch(rssUrl);
    const xml = await response.text();

    // Extraer el primer enlace de video desde el XML
    const match = xml.match(
      /<link>(https:\/\/www\.tiktok\.com\/@[^<]+\/video\/[^<]+)<\/link>/i
    );

    if (!match || !match[1]) {
      console.log(`⚠️ No se pudo extraer enlace del RSSHub de TikTok (${TIKTOK_USERNAME}).`);
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

  // Intervalos automáticos
  setInterval(checkYouTube, 5 * 60 * 1000); // cada 5 min
  setInterval(checkTikTok, 10 * 60 * 1000); // cada 10 min
  setInterval(checkTwitch, 2 * 60 * 1000); // cada 2 min
});

client.login(DISCORD_TOKEN);
