// 💫 KeepAlive — mantiene vivo al bot en Render
import express from "express";

const app = express();
const PORT = process.env.PORT || 10000;

// Endpoint silencioso para el health check de Render
app.get("/", (_, res) => res.status(200).send("✨ Blood Moon Secretary está despierta."));

app.listen(PORT, () => {
  console.log(`💫 Keep-alive escuchando en el puerto ${PORT}`);
});
