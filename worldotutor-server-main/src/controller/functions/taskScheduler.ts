import { CloudTasksClient } from '@google-cloud/tasks';
import { SCHEDULED_TASK_TYPE } from '../../utils/constants'
// Instantiates a client.

type Queues = "schedule-meet-tasks" | "scheduled-notifications"

type TASK_TYPES = "CREATE_MEET" | "END_MEET" | "EXECUTE_NOTIFICATION";

const tasksUrlMap: typeof SCHEDULED_TASK_TYPE = {
  "CREATE_MEET": "https://worldotutor.onrender.com/create-meet",
  "END_MEET": "https://worldotutor.onrender.com/end-meet",
  "EXECUTE_NOTIFICATION": "https://7813-106-205-199-193.ngrok-free.app/execute-notification"
}

const project = 'worldotutor-13922';
const location = 'asia-south1';

let projectId = process.env.GOOGLE_PROJECT_ID;
let keyFilename = "key.json";

export async function createTask(queue: Queues, triggerAt: number, payload: any, type: TASK_TYPES) {
  const client = new CloudTasksClient({
    projectId,
    keyFilename
  });

  const parent = client.queuePath(project, location, queue);

  const convertedPayload = JSON.stringify(payload);
  const body = Buffer.from(convertedPayload).toString('base64');

  const task = {
    httpRequest: {
      httpMethod: "POST",
      url: tasksUrlMap[type],
      headers: {
        "Content-type": "application/json"
      },
      body: body,
    },
    scheduleTime: {
      seconds: triggerAt,
    }
  }

  const request = {
    parent: parent,
    task: task,
  };

  // @ts-ignore
  const [response] = await client.createTask(request);
  const splits = response.name.split("/");
  return splits[splits.length - 1];
}

export async function deleteTask(queue: Queues, taskId: string) {
  try {
    const client = new CloudTasksClient({
      projectId,
      keyFilename
    });
    let name = client.taskPath(project, location, queue, taskId);
    const x = await client.deleteTask({ name });
    return x;
  } catch (e) {
    console.log(e);
    throw new Error("Something went wrong in deleting task")
  }
}

