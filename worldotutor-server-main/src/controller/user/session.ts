import { ObjectId, Transaction, TransactionOptions } from "mongodb";
import { classesCollection, client, plansCollection, scheduleMeetTasks } from "../../config/mongodb-config";
import { MINUTES_BEFORE_ZOOM_TRIGGER, SCHEDULED_TASK_TYPE } from "../../utils/constants";
import { createTask, deleteTask } from "../functions/taskScheduler";

export let lookupTutorFromSession = [
  {
    $lookup: {
      from: "tutors",
      let: {
        tutorId: {
          $toObjectId: "$tutorId",
        },
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$_id", "$$tutorId"],
            },
          },
        },
        {
          $project: {
            name: "$personal.data.name",
            profilePic: "$personal.data.profilePic"
          },
        },
        {
          $limit: 1,
        },
      ],
      as: "tutor",
    },
  },
  {
    $set: {
      tutor: {
        $arrayElemAt: ["$tutor", 0],
      },
    },
  },
]

export let lookupUserFromSession = [
  {
    $lookup: {
      from: "users",
      let: {
        userId: {
          $toObjectId: "$userId",
        },
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$_id", "$$userId"],
            },
          },
        },
        {
          $project: {
            name: "$name",
            email: "$email",
            profilePic: "$profilePic"
          },
        },
        {
          $limit: 1,
        },
      ],
      as: "user",
    },
  },
  {
    $set: {
      user: {
        $arrayElemAt: ["$user", 0],
      },
    },
  },
]

async function getAll(userId: string, filters: any) {
  let agg = [
    {
      $match: {
        $expr: {
          $eq: ["$userId", userId]
        },
        ...filters
      }
    },
    ...lookupTutorFromSession,
    { $sort: { createdAt: -1 } }
  ];
  const result = await classesCollection.aggregate(agg).toArray();
  return result;
}


interface ISession {
  _id: ObjectId
  userId: string,
  tutorId: string,
  category: {
    name: string[],
    board: string,
    grade: string
  },
  type: "trial" | "plan",
  categoryName: string,
  scheduledTime: {
    start: Date,
    end: Date
  },
  sessionDuration: 60,
  status: string,
  createdAt: Date,
  updatedAt: Date
}

interface SessionBody {
  userId: string,
  tutorId: string,
  type: "trial" | "plan",
  sessionDuration: 60,
  category: {
    name: string[],
    board: string,
    grade: string
  },
  categoryName: string,
  scheduledTime: {
    start: Date,
    end: Date
  }
}

async function add(body: SessionBody) {
  const session: ISession = {
    ...body,
    _id: new ObjectId(),
    scheduledTime: {
      start: new Date(body.scheduledTime.start),
      end: new Date(body.scheduledTime.end),
    },
    status: "upcoming",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  let triggerAt = (new Date(body.scheduledTime.start).getTime() - (1000 * 60 * MINUTES_BEFORE_ZOOM_TRIGGER)) / 1000;
  const triggerEndMeetAt = (new Date(body.scheduledTime.start).getTime() + (1000 * 60 * 60)) / 1000

  const taskId = await createTask("schedule-meet-tasks", triggerAt, session, "CREATE_MEET");
  const taskId2 = await createTask("schedule-meet-tasks", triggerEndMeetAt, session, "END_MEET");

  if (taskId && taskId2) {
    const result = await classesCollection.insertOne({ ...session });
    await scheduleMeetTasks.insertOne({
      taskId: taskId,
      type: SCHEDULED_TASK_TYPE.CREATE_MEET,
      classId: result.insertedId,
      triggerAt,
      createdAt: new Date()
    })
    await scheduleMeetTasks.insertOne({
      taskId: taskId2,
      type: SCHEDULED_TASK_TYPE.END_MEET,
      classId: result.insertedId,
      triggerAt: triggerEndMeetAt,
      createdAt: new Date()
    })
    return classesCollection.findOne({ _id: result.insertedId });
  } else {
    return null;
  }
}

async function update(id: string, data: any) {
  const session = await classesCollection.findOne({ _id: new ObjectId(id) });
  if (!session) return;
  if (data.rescheduledBy) {
    const transactionSession = client.startSession();
    const transactionOptions: TransactionOptions = {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    };
    return await transactionSession.withTransaction(async () => {
      const plan = await plansCollection.findOne({ _id: new ObjectId(session.planId) });
      if (!plan) throw new Error("Plan not found for this session");
      let x: any = {};
      // tutor send to reschedule request
      if (data.actionRequired === 'schedule' && data.rescheduledBy === 'tutor') {
        x.noOfReschedulesByTutor = { total: plan.noOfReschedulesByTutor.total, occured: plan.noOfReschedulesByTutor.occured + 1 }
        await classesCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              ...data,
              updatedAt: new Date()
            },
          })
        await plansCollection.updateOne({ _id: new ObjectId(session.planId) }, {
          $set: {
            ...x,
            updatedAt: new Date()
          },
        });
        return await classesCollection.findOne({ _id: new ObjectId(id) });
      } else {
        // student is scheduling the session that tutor requested for reschedule 
        if (data.actionRequired === 'schedule') {
          await classesCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                status: data.status,
                rescheduledBy: 'tutor',
                scheduledTime: {
                  start: new Date(data.scheduledTime.start),
                  end: new Date(data.scheduledTime.end),
                },
                updatedAt: new Date()
              },
              $unset: {
                actionRequired: ""
              }
            })
        } else {
          // student is rescheduling the session
          x.noOfReschedulesByStudent = { total: plan.noOfReschedulesByStudent.total, occured: plan.noOfReschedulesByStudent.occured + 1 }
          await classesCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                ...data,
                scheduledTime: {
                  start: new Date(data.scheduledTime.start),
                  end: new Date(data.scheduledTime.end),
                },
                updatedAt: new Date()
              },
              $unset: {
                actionRequired: ""
              }
            })
          await plansCollection.updateOne({ _id: new ObjectId(session.planId) }, {
            $set: {
              ...x,
              updatedAt: new Date()
            },
          });
        }
      }
      
      const tasks = await scheduleMeetTasks.find({ classId: new ObjectId(id) }).toArray();
      if (tasks.length > 0) {
        for (const task of tasks) {
          await deleteTask("schedule-meet-tasks", task.taskId);
        }
        await scheduleMeetTasks.deleteMany({ classId: new ObjectId(id) });
      }

      let triggerAt = (new Date(data.scheduledTime.start).getTime() - (1000 * 60 * MINUTES_BEFORE_ZOOM_TRIGGER)) / 1000;
      const triggerEndMeetAt = (new Date(data.scheduledTime.start).getTime() + (1000 * 60 * 60)) / 1000
      const taskId = await createTask("schedule-meet-tasks", triggerAt, session, "CREATE_MEET");
      const taskId2 = await createTask("schedule-meet-tasks", triggerEndMeetAt, session, "END_MEET");

      if (taskId && taskId2) {
        await scheduleMeetTasks.insertOne({
          taskId: taskId,
          type: SCHEDULED_TASK_TYPE.CREATE_MEET,
          classId: new Object(id),
          triggerAt,
          createdAt: new Date()
        })
        await scheduleMeetTasks.insertOne({
          taskId: taskId2,
          type: SCHEDULED_TASK_TYPE.END_MEET,
          classId: new Object(id),
          triggerAt: triggerEndMeetAt,
          createdAt: new Date()
        })
      }

      return await classesCollection.findOne({ _id: new ObjectId(id) });
    }, transactionOptions)
  }
  if (data.status === "cancelled") {
    const transactionSession = client.startSession();
    const transactionOptions: TransactionOptions = {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    };
    return await transactionSession.withTransaction(async () => {
      const plan = await plansCollection.findOne({ _id: new ObjectId(session.planId) });
      if (!plan) throw new Error("Plan not found for this session");
      const tasks = await scheduleMeetTasks.find({ classId: new ObjectId(id) }).toArray();
      if (tasks.length > 0) {
        for (const task of tasks) {
          await deleteTask("schedule-meet-tasks", task.taskId);
        }
        await scheduleMeetTasks.deleteMany({ classId: new ObjectId(id) });
      }
      let x: any = {};
      if (data.cancelledBy === "user") {
        x.noOfCancelsByStudent = { total: plan.noOfCancelsByStudent.total, occured: plan.noOfCancelsByStudent.occured + 1 }
      } else if (data.cancelledBy === "tutor") {
        x.noOfCancelsByTutor = { total: plan.noOfCancelsByTutor.total, occured: plan.noOfCancelsByTutor.occured + 1 }
      }
      await plansCollection.updateOne({ _id: new ObjectId(session.planId) }, {
        $set: {
          ...x,
          updatedAt: new Date()
        },
      });
      await classesCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...data,
            updatedAt: new Date()
          },
        })
      return await classesCollection.findOne({ _id: new ObjectId(id) });
    }, transactionOptions)
  }

  await classesCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...data,
        updatedAt: new Date()
      },
    })
  return await classesCollection.findOne({ _id: new ObjectId(id) });
}


const SessionController = {
  getAll,
  add,
  update,
}

export default SessionController;