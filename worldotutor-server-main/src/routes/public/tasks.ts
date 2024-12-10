import express from 'express';
import { ObjectId } from 'mongodb';
import { classesCollection, scheduleMeetTasks, tutorsCollection } from '../../config/mongodb-config';
import SessionController from '../../controller/user/session';
import { endMeeting, generateMeet, getZoomUserIdToCreateMeet } from '../../utils/zoom';
import { SCHEDULED_TASK_TYPE } from '../../utils/constants';
import { Notifications } from '../notification';

const router = express.Router();

router.post("/create-meet", async (req, res) => {
  const session = req.body;
  console.log(session);
  const tutor = await tutorsCollection.findOne({ _id: new ObjectId(session.tutorId) });
  await scheduleMeetTasks.deleteOne({ type: SCHEDULED_TASK_TYPE.CREATE_MEET, classId: session._id })
  if (tutor) {
    const tutorEmail = tutor.personal.data.email;
    const zoomUserId = await getZoomUserIdToCreateMeet(session.scheduledTime.start);
    let meetData = await generateMeet(
      zoomUserId,
      tutorEmail,
      { start: session.scheduledTime.start },
      { agenda: "Online Class", topic: `${session.category.name} Lesson` })
    console.log(meetData);
    if (meetData) {
      await SessionController.update(session._id.toString(), {
        meeting: {
          id: meetData.id,
          hostId: meetData.host_id,
          hostEmail: meetData.host_email,
          timeZone: meetData.timezone,
          createdAt: meetData.created_at
        }
      })
    }
    res.send("Success").status(200);
  } else {
    res.send("Error").status(500);
  }
})

router.post("/end-meet", async (req, res) => {
  const payloadSession = req.body;
  const session = await classesCollection.findOne({ _id: new ObjectId(payloadSession._id) });
  await scheduleMeetTasks.deleteOne({ type: SCHEDULED_TASK_TYPE.CREATE_MEET, classId: payloadSession._id })
  if (session) {
    await endMeeting(session.meeting.id);
    await SessionController.update(session._id.toString(), {
      status: "completed",
      actionRequired: "mark-attendance",
      attendance: {
        tutor: "pending",
        student: "pending"
      }
    })
    res.send("Success").status(200);
  } else {
    res.send("Error").status(500);
  }
})

router.post("/execute-notification", async (req, res) => {
  const payload = req.body;
  await Notifications.trigger(payload.type, payload);
  res.send("Success").status(200);
})


export default router;