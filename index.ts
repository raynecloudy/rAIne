import { Client, GatewayIntentBits } from "discord.js";
import * as express from "express";
import * as path from "path";
import * as cors from "cors";
import { Database } from "sqlite3";

import dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.login(process.env.TOKEN);

let cors_options = {
  origin: "https://raynec.dev",
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 8000;

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

app.get("/", cors(cors_options), (req, res) => {
  res.json({"message": "hii!! enter a word in the URL to get a cool AI-generated result. example: https://ai.raynec.dev/hi"});
});

app.get("/:word", async (req, res) => {
  let l = 100;
  let w = req.params.word;
  res.json(await predict(w, l));
});

// app.get(":word/length/:len", async (req, res) => {
//   let l = Number.parseInt(req.params.len);
//   if (l > 100) {
//     l = 100;
//   }
//   let w = req.params.word;
//   res.json(await predict(w, l));
// });

/*
app.get("/api/add/:word/:word2", (req, res) => {
  db.run("INSERT INTO words (word, next) VALUES (?, ?)", [req.params.word.toLowerCase(), req.params.word2.toLowerCase()], (err) => {
    if (err) {
      res.json({"error": err.message});
    } else {
      res.json({"result": `success`});
    }
  });
});

app.get("/api/add/:sentence", async (req, res) => {
  const words = req.params.sentence.toLowerCase().split(/[ ]+/);
  let add = (i: number) => new Promise((resolve) => {
    db.run("INSERT INTO words (word, next) VALUES (?, ?)", [words[i], words[i + 1]], (err) => {
      resolve(0);
      if (err) {
        res.json({"error": err.message});
        return;
      }
    });
  });
  for (let i = 0; i < words.length - 1; i++) {
    await add(i);
  }
  res.json({"result": `success`});
});
*/

app.get("/count_nodes", (req, res) => {
  db.get("SELECT COUNT(*) FROM words", (err, count) => {
    if (err) {
      res.json({"error": err.message});
      return;
    }
    res.json({"count": count["COUNT(*)"]});
  });
});

let predict = async (pw: string, l: number) => {
  let s = pw.toLowerCase();
  let w = pw.toLowerCase();
  let add = (word: string) => new Promise((resolve) => {
    db.all("SELECT * FROM words WHERE word = ?", [w], (err, words: {word:string,next:string}[]) => {
      if (err) {
        resolve(0);
        return {"error": err.message};
      } else if (words.length === 0) {
        resolve(0);
        return {"result": s};
      } else {
        w = words[Math.floor(Math.random()*words.length)].next;
        s = `${s} ${w}`;
        resolve(0);
      }
    });
  });
  for (let i = 0; i < l; i++) {
    await add(w);
  }
  return {"result": s};
}

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
});

client.on("ready", () => {
  console.log("discord bot ready");
})

client.on("messageCreate", async (message) => {
  if (message.content.startsWith(`<@${client.user.id}>`) && message.content.includes(" ")) {
    await message.reply((await predict(message.content.slice(message.content.lastIndexOf(" ") + 1), 100)).result);
  }
});
