import { Express } from 'express';
import plans from './plan';
import payment from './payment';
import meetWebHook from './meetWebHook';
import sessions from './sessions';
import userRequirement from './userRequirement';
import users from './user';
import recentTutors from './recentTutors';


export default function (app: Express) {
  app.use("/u", plans);
  app.use("/u", payment);
  app.use("/u", meetWebHook);
  app.use("/u", sessions);
  app.use("/u", userRequirement);
  app.use("/u", users);
  app.use("/u", recentTutors);
}