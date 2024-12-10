import { Express } from "express";

import auth from "./auth";
import upload from "./upload";
import userRoutes from './user/index'
import adminRoutes from './admin/index'
import tutorRoutes from './tutor/index'
import publicRoutes from './public/index'

import chat from './chat'
import notifications from './notification'

export default function (app: Express) {
  app.use("/", auth);
  app.use("/", upload);
  app.use("/", chat);
  app.use("/", notifications);


  userRoutes(app)
  tutorRoutes(app)
  adminRoutes(app)
  publicRoutes(app)
}
