import bodyParser from "body-parser";
import flash from "connect-flash";
import MongoStore from "connect-mongo";
import cors from "cors";
import express from "express";
import session from "express-session";
import { ObjectId } from "mongodb";
import passport from "passport";
import { accountsCollection, chatSessions, connectToDatabase, messages } from "./config/mongodb-config";
import http from 'http';
import { Server } from "socket.io";
import router from "./routes";

import dotenv from 'dotenv'
dotenv.config()

// import path from 'path';

import { initPassportStragtegies } from "./config/passport-config";
import { logError, returnError } from "./middlewares/errors";
import { ADMIN_URL, STUDENT_URL, TUTOR_URL } from "./utils/constants";
import { storeMessage, updateChatSession } from "./controller/chatController";
// import { createStream } from "rotating-file-stream";
// import morganBody from "morgan-body";
// import morgan from "morgan";

async function chalk() {
  return (await import("chalk")).default;
}

const app = express();
const server = http.createServer(app);

require("dotenv").config();

// this required, as we are sending cookie from client side




app.use(
  cors({
    origin:  [
      "http://localhost:3000", //tutor
      "http://localhost:3003", //student
      "http://localhost:3002", //admin,     
      STUDENT_URL,
      TUTOR_URL,
      ADMIN_URL,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,

  })
);


app.use(bodyParser.json({
  // Because Stripe needs the raw body, we compute it but only when hitting the Stripe callback URL.
  verify: function (req, res, buf) {
    // @ts-ignore
    var url = req.originalUrl;
    console.log(url, req.method)
    if (url.startsWith('/u/webhook')) {
      // @ts-ignore
      req.rawBody = buf.toString()
    }
  }
}));
// create a rotating write stream
// var accessLogStream = createStream("access.log", {
//   interval: "1d", // rotate daily
//   path: path.join(__dirname, "log"),
// });
// morganBody(app, {
//   // .. other settings
//   stream: accessLogStream,
// });

app.set("trust proxy", 1);
// below values in cookies to be changed for production
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_CLOUD_URI,
      collectionName: "sessions",
      dbName: "wot",
    }),

    cookie: {
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
      secure: process.env.NODE_ENV === 'production' ? true : 'auto',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

connectToDatabase()
  .then(() => {
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    initPassportStragtegies();

    const io = new Server(server, {
      cors: {
        origin: [STUDENT_URL, TUTOR_URL, ADMIN_URL],
        methods: ["GET", "POST"]
      }
    });
    // handle the chat sessions table
    io.use(async (socket, next) => {
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return next(new Error("invalid username"));
      }
      // @ts-ignore
      socket.userId = userId;
      console.log(`⚡: ${userId} is online`)
      await updateChatSession({ socketId: socket.id, userId: userId, lastSeen: new Date(), status: 'online' })
      // send all the queue messages
      const queueMessages = await messages.find(({ receiverId: userId, status: "pending" })).toArray();
      queueMessages.forEach((item) => {
        socket.emit("msg", {
          content: item.content,
          createdAt: item.createdAt,
          receiverId: item.receiverId,
          // @ts-ignore
          senderId: item.senderId,
          status: 'delivered',
          read: false
        });
        socket.to(socket.id).emit('msg', {
          content: item.content,
          createdAt: item.createdAt,
          receiverId: item.receiverId,
          // @ts-ignore
          senderId: item.senderId,
          status: 'delivered',
          read: false
        })
        messages.updateOne({ _id: new ObjectId(item._id) }, { $set: { status: "delivered" } });
      })
      next();
    });

    io.on('connection', (socket) => {

      socket.on("msg", async ({ content, to }) => {
        if (content.includes("@")) {
          return;
        }
        const result = await chatSessions.findOne({ userId: to });        if (result && result.status === 'online') {
          const res = await storeMessage({
            content,
            createdAt: new Date(),
            receiverId: to,
            // @ts-ignore
            senderId: socket.userId,
            status: 'delivered',
            read: false
          })
          console.log("SENDING TO", to);
          // send back to  sender
          socket.emit("msg", {
            _id: res.insertedId,
            content,
            createdAt: new Date(),
            receiverId: to,
            // @ts-ignore
            senderId: socket.userId,
            status: 'delivered',
            read: false
          });
          socket.to(result.socketId).emit("msg", {
            _id: res.insertedId,
            content,
            createdAt: new Date(),
            receiverId: to,
            // @ts-ignore
            senderId: socket.userId,
            status: 'delivered',
            read: false
          });

        } else {
          console.log("QUENING MESSAGE")
          // Create a queue of pending messages, when user id connects send messages to that socket
          socket.emit("msg", {
            content,
            createdAt: new Date(),
            receiverId: to,
            // @ts-ignore
            senderId: socket.userId,
            status: 'pending',
            read: false
          });
          storeMessage({
            content,
            createdAt: new Date(),
            receiverId: to,
            // @ts-ignore
            senderId: socket.userId,
            status: 'pending',
            read: false
          })
        }
      });

      socket.on("read", async ({ from, to, msgIds }) => {
        await messages.updateMany(
          { _id: { $in: msgIds.map((m: any) => new ObjectId(m)) } },
          { $set: { read: true } },
        )
        // const result = await chatSessions.findOne({ userId: to });
        // if (result && result.status === 'online') {
        //   socket.to(result.socketId).emit("read", {
        //     from,
        //     to,
        //     msgIds
        //   });
        // }
      })

      socket.on('disconnect', async () => {
        // @ts-ignore
        await updateChatSession({ socketId: null, userId: socket.userId, lastSeen: new Date(), status: 'offline' })
      });
    });


    router(app);

    app.use(logError);
    app.use(returnError);

    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser(async function (user, done) {
      // user coming from session stored in db
      // @ts-ignore
      const result = await accountsCollection.findOne({
        //@ts-ignore
        _id: new ObjectId(user.id!),
        //@ts-ignore
        role: user.role
      });
      if (result) {
        done(null, { ...result, id: result._id });
      } else {
        done(null, null);
      }
    });
  })
  .catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from 5000");

});

// // setup the logger
// app.use(
//   morgan(
//     ":method :status :url :response-time ms :res[content-length] :date[web]",
//     { stream: accessLogStream }
//   )
// );

const { log } = console;
// @ts-ignore
async function proxiedLog(...args) {
  // @ts-ignore
  const line = ((new Error("log").stack.split("\n")[2] || "…").match(
    /\(([^)]+)\)/
  ) || [, "not found"])[1];
  log.call(console, (await chalk()).blue(`${line}\n`), ...args);
}
console.info = proxiedLog;
console.log = proxiedLog;

// process.env.PORT var will come from gcp
const port = parseInt(process.env.PORT!) || process.env.LOCAL_SERVER_PORT;
server.listen(port, () => {
  console.log(`wot listening on port ${process.env.NODE_ENV} ${process.env.LOCAL_SERVER_PORT}`)
  console.log("student", STUDENT_URL)
  console.log("tutor", TUTOR_URL);
  console.log("admin", ADMIN_URL);
}
);
