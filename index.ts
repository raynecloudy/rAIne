import * as express from "express";
import * as path from "path";
const sqlite = require("sqlite3");

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 8080;

const db = new sqlite.Database("./ai.db", (err) => {
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

app.get("/api/predict/:word", (req, res) => {
  db.all("SELECT * FROM words WHERE word = ?", [req.params.word], (err, words: {word:string,next:string}[]) => {
    if (err) {
      res.json({"error": ":("});
    } else {
      res.json({"result": `${req.params.word} ${words[Math.floor(Math.random()*words.length)].next}`});
    }
  });
});

app.get("/api/add/:word/:word2", (req, res) => {
  db.run("INSERT INTO words (word, next) VALUES (?, ?)", [req.params.word, req.params.word2], (err) => {
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
