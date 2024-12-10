import { ObjectId, TransactionOptions } from "mongodb";
import { classesCollection, client, plansCollection, scheduleMeetTasks } from "../../config/mongodb-config";
import { deleteTask } from "./taskScheduler";

export async function cancelPlan(filterPlan: any) {
  const session = client.startSession();
  const transactionOptions: TransactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };
  try {
    const currentPlan = await plansCollection.findOne(filterPlan);
    if (currentPlan) {
      const classList = await classesCollection.find({ planId: currentPlan._id.toString(), status: { $in: ['upcoming', 'next'] } }).toArray();
      let classIdsList: ObjectId[] = [];
      classList.map((c) => classIdsList.push(c._id));

      for (const classId of classIdsList) {
        const tasks = await scheduleMeetTasks.find({ classId: classId }).toArray();
        for (const task of tasks) {
          await deleteTask("schedule-meet-tasks", task.taskId);
        }
        await scheduleMeetTasks.deleteMany({ classId: classId });
      }

      await session.withTransaction(async () => {
        //set plan status to cancelled
        await plansCollection.findOneAndUpdate(filterPlan, {
          $set: {
            status: "cancelled",
            updatedAt: new Date()
          }
        })
        // cancel all scheduled classes i.e with status upcoming or next (not completed)
        await classesCollection.updateMany({ _id: { $in: classIdsList } }, {
          $set: {
            status: 'cancelled',
            cancelledBy: 'user'
          }
        })
      }, transactionOptions)
    }

  } catch (err) {
    console.log(err);
    return;
  } finally {
    await session.endSession();
    return
  }
}