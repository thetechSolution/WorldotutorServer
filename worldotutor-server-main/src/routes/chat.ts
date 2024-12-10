import express from 'express';
import { chatSessions, conversations, messages, tutorsCollection, usersCollection } from '../config/mongodb-config';
import { ResponseApi } from '../core/response';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.get("/user-chat-session", async (req, res) => {
  const { id } = req.query;
  if (id) {
    const result = await chatSessions.findOne({ userId: id });
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  } else {
    ResponseApi(res, {
      status: "BAD_REQUEST",
      message: "Invalid Params"
    })
  }
})


router.get("/:userId/conversations", async (req, res) => {
  const convs = await conversations.find({ users: { $in: [req.params.userId] } }).toArray();
  const result = [];
  for (const c of convs) {
    const student = await usersCollection.findOne({ _id: { $in: c.users.map((u: any) => new ObjectId(u)) } }, { projection: { _id: 1, name: 1, profilePic: 1 } });
    const tutor = await tutorsCollection.findOne({ _id: { $in: c.users.map((u: any) => new ObjectId(u)) } }, { projection: { _id: 1, "personal.data.name": 1, "personal.data.profilePic": 1 } });
    const recentMessage = await messages.findOne({ conversationId: c._id }, { sort: { createdAt: -1 } })
    result.push({
      ...c,
      user: req.params.userId === student?._id.toString() ?
        {
          _id: tutor?._id, name: tutor?.personal.data.name, profilePic: tutor?.personal.data.profilePic
        }
        : student,
      recentMessage
    })
  }

  ResponseApi(res, { status: "OK", data: result });
})


router.get("/:userId/conversations/:conversationId/messages", async (req, res) => {
  const result = await messages.find({ conversationId: new ObjectId(req.params.conversationId) }).toArray();
  if (result) {
    ResponseApi(res, { status: "OK", data: result });
  } else {
    ResponseApi(res, { status: "OK", message: "Server Error" });
  }
})

router.get("/:userId/unread-messages", async (req, res) => {
  const result = await messages.find({ receiverId: req.params.userId, read: false }).toArray();
  if (result) {
    ResponseApi(res, { status: "OK", data: result.length });
  } else {
    ResponseApi(res, { status: "OK", message: "Server Error" });
  }
})

router.put("/messages/read", async (req, res) => {
  const { messageIds } = req.body;
  const result = await messages.updateMany(
    { _id: { $in: messageIds.map((m: any) => new ObjectId(m)) } },
    { $set: { read: true } },
  )
  ResponseApi(res, {
    status: 'OK',
    data: result
  })
})
export default router;