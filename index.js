const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { AsyncNedb } = require("nedb-async");
const cors = require("cors");

const hyperTexts = new AsyncNedb({
  filename: "db/hyperText.db",
  autoload: true,
});

const users = new AsyncNedb({
  filename: "db/users.db",
  autoload: true,
});

function HyperTextModel(token, data) {
  this.token = token;
  this.data = data;
}

app.use(express.json({ limit: "50mb" }));
app.use(cors());

app.post("/generate", async (req, res) => {
  try {
    const user = await users.asyncFindOne({
      username: req.body.username,
    });
    if (user) {
      return res.send({ status: false });
    } else {
      const user = await users.asyncInsert({ username: req.body.username });
      return res.send({ status: true, token: user._id });
    }
  } catch (err) {
    return res.send({ error: err });
  }
});

app.get("/token/:token", async (req, res) => {
  try {
    const user = await users.asyncFindOne({
      _id: req.params.token,
    });
    if (user) {
      const hyperText = await hyperTexts.asyncFindOne({
        token: user._id,
      });
      if (hyperText) {
        return res.send({ markup: hyperText.data });
      } else {
        return res.send({ markup: [] });
      }
    } else {
      return res.send({ error: "invalid token" });
    }
  } catch (err) {
    return res.send({ error: err });
  }
});

app.post("/token/:token", async (req, res) => {
  try {
    const user = await users.asyncFindOne({
      _id: req.params.token,
    });
    if (user) {
      const hyperText = await hyperTexts.asyncFindOne({
        token: user._id,
      });
      if (hyperText && req.body.data) {
        const updatedhyperText = await hyperTexts.asyncUpdate(
          { token: req.params.token },
          { $set: { data: req.body.data } }
        );
        res.send({ hyperText: updatedhyperText });
      } else {
        if (req.body.data) {
          const hyperText = new HyperTextModel(req.params.token, req.body.data);
          const insertedhyperText = await hyperTexts.asyncInsert(hyperText);
          return res.send({ hyperText: insertedhyperText });
        }
        return res.status(404).send({ error: "empty markup" });
      }
    } else {
      return res.status(404).send({ error: "invalid token" });
    }
  } catch (err) {
    return res.send({ error: err });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
