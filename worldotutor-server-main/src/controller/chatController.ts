import { chatSessions, conversations, messages } from "../config/mongodb-config";

interface ChatSession {
  socketId: string | null,
  userId: string,
  lastSeen: Date,
  status: 'online' | 'offline'
}

interface Messsage {
  conversationId?: string,
  content: string,
  senderId: string,
  receiverId: string,
  status: 'pending' | 'delivered' | 'read'
  createdAt: Date,
  read: boolean
}

export async function updateChatSession(body: ChatSession) {
  const user = await chatSessions.findOne({ userId: body.userId });
  if (user) {
    return await chatSessions.updateOne({ _id: user._id }, {
      $set: {
        ...body,
      }
    })
  } else {
    return await chatSessions.insertOne({
      ...body,
    })
  }
}

export async function storeMessage(message: Messsage) {
  const con = await conversations.findOne({ users: { $all: [message.senderId, message.receiverId] } });
  if (con) {
    return await messages.insertOne({ ...message, conversationId: con._id });
  } else {
    const conv = await conversations.insertOne({
      users: [message.senderId, message.receiverId],
      createdAt: new Date(),
    })
    return await messages.insertOne({ ...message, conversationId: conv.insertedId });
  }
}


