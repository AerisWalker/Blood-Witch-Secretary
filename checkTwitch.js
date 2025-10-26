import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const ACCESS_TOKEN = process.env.TWITCH_ACCESS_TOKEN;
const USER = process.env.TWITCH_USER || "aeriswalker";

async function testTwitch() {
  console.log("🔍 Probando conexión con Twitch...");

  const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${USER}`, {
    headers: {
      "Client-ID": CLIENT_ID,
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
    },
  });

  const data = await res.json();

  if (data.error) {
    console.log("❌ Error:", data.message || data.error);
  } else if (data.data && data.data.length > 0) {
    const stream = data.data[0];
    console.log("✅ Token válido y stream detectado:");
    console.log(`🎮 Canal: ${stream.user_name}`);
    console.log(`🕹️ Juego: ${stream.game_name}`);
    console.log(`🎥 Título: ${stream.title}`);
  } else {
    console.log("✅ Token válido, pero el canal no está en directo (data vacía).");
  }
}

testTwitch();
