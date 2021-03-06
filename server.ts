import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
const FileStore = require("session-file-store")(session);
import next from "next";
import admin from "firebase-admin";

const port = (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const firebase = admin.initializeApp(
  {
    credential: admin.credential.cert(require("./credentials/server"))
  },
  "server"
);

app.prepare().then(() => {
  const server = express();

  server.use(bodyParser());
  server.use(
    session({
      secret: "geheimnis",
      saveUninitialized: true,
      store: new FileStore({ secret: "geheimnis" }),
      resave: false,
      rolling: true,
      cookie: { maxAge: 604800000, httpOnly: true } // week
    })
  );

  server.use((req, res, next) => {
    // @ts-ignore
    req.firebaseServer = firebase;
    next();
  });

  server.post("/api/login", (req, res) => {
    if (!req.body) return res.sendStatus(400);

    const token = req.body.token;
    firebase
      .auth()
      .verifyIdToken(token)
      .then(decodedToken => {
        if (req.session != null) {
          req.session.decodedToken = decodedToken;
          return decodedToken;
        }
      })
      .then(decodedToken => res.json({ status: true, decodedToken }))
      .catch(error => res.json({ error }));
  });

  server.post("/api/logout", (req, res) => {
    if (req.session != null) {
      req.session.decodedToken = null;
      res.json({ status: true });
    }
  });

  server.get("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
