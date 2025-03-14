import { Client, GatewayIntentBits } from "discord.js";
import * as express from "express";
import * as path from "path";
import { Database } from "sqlite3";

import dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  intents: [
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
  ]
});

client.login(process.env.TOKEN);

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 8080;

const db = new Database("./ai.db", (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.run(`CREATE TABLE IF NOT EXISTS words (
  word TEXT NOT NULL,
  next TEXT NOT NULL
)`, (err) => {
  if (err) {
    console.error(err.message);
  }
});

app.use(express.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "../views"))
  .set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/api", (req, res) => {
  res.json({"hello": "world"});
});

app.get("/api/predict/:word/length/:len", async (req, res) => {
  let l = Number.parseInt(req.params.len);
  let w = req.params.word;
  let s = req.params.word;
  let add = (word: string) => new Promise((resolve) => {
    db.all("SELECT * FROM words WHERE word = ?", [w], (err, words: {word:string,next:string}[]) => {
      if (err) {
        res.json({"error": err.message});
        return;
      } else if (words.length === 0) {
        res.json({"result": s});
        return;
      } else {
        w = words[Math.floor(Math.random()*words.length)].next;
        s = `${s} ${w}`;
        resolve(0);
      }
    });
  });
  console.log("ready");
  for (let i = 0; i < l; i++) {
    await add(w);
  }
  console.log(s);
  res.json({"result": s});
});

app.get("/api/add/:word/:word2", (req, res) => {
  db.run("INSERT INTO words (word, next) VALUES (?, ?)", [req.params.word.toLowerCase(), req.params.word2.toLowerCase()], (err) => {
    if (err) {
      res.json({"error": err.message});
    } else {
      res.json({"result": `success`});
    }
  });
});

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
});

client.on("ready", () => {
  console.log("discord bot ready");
})
