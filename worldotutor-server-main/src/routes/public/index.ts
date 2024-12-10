import { Express } from 'express';
import tasks from './tasks';
import enquiry from './enquiry';
import legal from './legal';
import categories from './categories'
import pricing from './pricing'
import tutors from './tutors'
import recentTutors from '../user/recentTutors';


export default function (app: Express) {
  app.use("/", tasks);
  app.use("/", enquiry);
  app.use("/", legal);
  app.use("/", pricing);
  app.use("/", categories);
  app.use("/", tutors);
  app.use("/", recentTutors);

}