import { Express } from 'express';
import classes from './classes';
import plans from './plans';
import sessions from './sessions';
import analytics from './analytics';
import profileSetup from './profileSetup';
import profile from "./profile";

export default function (app: Express) {
  app.use("/t", classes);
  app.use("/t", plans);
  app.use("/t", analytics);
  app.use("/t", sessions);
  app.use("/t", profileSetup);  
  app.use("/t", profile);
}