import { Express } from 'express';
import plans from './plans';
import classes from './classes';
import analytics from './analytics';
import transactions from './transactions';
import enquiry from './enquiry'
import legal from './legal'
import categories from './categories'
import pricing from './pricing'
import tutor from './tutor'
import students from './students'

export default function (app: Express) {
  app.use("/a", plans);
  app.use("/a", classes);
  app.use("/a", analytics);
  app.use("/a", transactions);
  app.use("/a", enquiry);
  app.use("/a", legal);
  app.use("/a", pricing);
  app.use("/a", categories);
  app.use("/a", students);
  app.use("/a", tutor);
}