import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("🌙 Blood Moon Secretary sigue vigilando desde las sombras.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`💫 Keep-alive escuchando en el puerto ${PORT}`);
});
