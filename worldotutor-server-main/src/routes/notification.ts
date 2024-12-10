import express from 'express';
import { ObjectId } from 'mongodb';
import { notifications, usersCollection } from '../config/mongodb-config';
import { EMAIL_TEMPLATES, SendEmail } from "../config/send-emails";
import { createTask } from "../controller/functions/taskScheduler";
import { ResponseApi } from '../core/response';

const router = express.Router();
type NotificationType = "EMAIL" | "IN_APP" | "PUSH"
type NotificationBehaviour = "SCHEDULED" | "TRIGGER"

interface Email {
  to: string
  templateId: string,
  dynamicTemplateData: { [x: string]: any }
}

interface Notification {
  title?: string,
  description?: string,
  email?: Email
  userId: string,
  actionUrl?: string,
  metadata: {
  },
  read?: boolean
  type: NotificationType,
  triggerAt: number
  createdAt: Date

}

async function schedule(type: NotificationType, payload: Notification, triggerAt: number) {
  const t = await createTask("scheduled-notifications", triggerAt, payload, "EXECUTE_NOTIFICATION");
  return;
}

async function trigger(type: NotificationType, payload: Notification) {
  console.log(payload);
  if (type === "EMAIL") {
    if (!payload.email) return;
    await SendEmail.mail(payload.email?.to, payload.email?.templateId, payload.email?.dynamicTemplateData)
    return;
  }
  if (type === "IN_APP") {
    await notifications.insertOne(payload);
    return;
  }
  return;
}

export const Notifications = {
  schedule,
  trigger
}

// Book DEMO, send email to student&tutor (trigger)-(EMAIL)(IN_APP)
// Class Canelled, send push to student & tutor (scheduled)-(EMAIL)(IN_APP) 

router.get("/noti", async (req, res) => {
  const triggerAt = (new Date().getTime() + (1000 * 30)) / 1000
  const scheduledTime = {
    start: new Date().getTime() + (1000 * 60 * 30) / 1000,
    end: new Date().getTime() + (1000 * 60 * 90) / 1000
  };
  const userId = "64db805faac49bed774ce95e";
  const user = await usersCollection.findOne(({ _id: new ObjectId(userId) }))
  if (!user) return;
  const payload = {
    userId,
    metadata: {},
    triggerAt: new Date().getTime(),
    createdAt: new Date(),
  }
  // await Notifications.trigger("EMAIL", {
  //   ...payload,
  //   type: "EMAIL",
  //   email: {
  //     to: user.email,
  //     templateId: EMAIL_TEMPLATES.newDemoBooked,
  //     dynamicTemplateData: {
  //       name: user.name,
  //       date: scheduledTime.start,
  //       sessionDuration: 60
  //     },
  //   },
  // })
  // await Notifications.schedule("EMAIL", {
  //   ...payload,
  //   type: "EMAIL",
  //   email: {
  //     to: user.email,
  //     templateId: EMAIL_TEMPLATES.reminderDemoClass,
  //     dynamicTemplateData: {
  //       name: user.name,
  //       date: scheduledTime.start,
  //       sessionDuration: 60
  //     },
  //   }
  // }, triggerAt)
  await Notifications.schedule("IN_APP", {
    ...payload,
    type: "IN_APP",
    title: "Demo Class Upcoming",
    description: "Demo Class in 30mins. Be Ready!",
    actionUrl: "/classes",
    read: false
  }, triggerAt)
  res.send("DONE").status(200);
})

router.get("/:userId/notifications", async (req, res) => {
  const result = await notifications.find({ userId: req.params.userId }).sort("triggerAt", -1).toArray();
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.put("/notifications/:id", async (req, res) => {
  const data = req.body;
  const result = await notifications.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { ...data } });
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.delete("/notifications/:id", async (req, res) => {
  const result = await notifications.deleteOne({ _id: new ObjectId(req.params.id) });
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})
export default router;