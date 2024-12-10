import { classesCollection } from "../../config/mongodb-config";
import TutorController from "../tutor";

async function getAll(tutorId: string) {
  let agg = [
    {
      $match: {
        $expr: {
          $eq: ["$tutorId", tutorId]
        }
      }
    },
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
              name: 1,
              profilePic: 1,
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
    { $sort: { createdAt: -1 } },
  ]
  const result = await classesCollection.aggregate(agg).toArray();
  return result;
}


async function getAvailableSlots(tutorId: string) {
  const classes = await getAll(tutorId);
  const profile = await TutorController.getById(tutorId);
  if (!profile) return;
  const calender = profile.calender;
  let notAvailabelSlots: string[] = [];
  classes.forEach((slot: any) => slot.status !== "cancelled" ? notAvailabelSlots.push(slot.scheduledTime.start.toISOString()) : null);
  return calender.filter((slot: any) => !notAvailabelSlots.includes(slot.start));
}

let lookupUser = [
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
            name: 1,
            profilePic: 1
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

async function getByTutorId(tutorId: string, filters: any) {
  let agg = [
    {
      $match: {
        $expr: {
          $eq: ["$tutorId", tutorId]
        },
        ...filters
      }
    },
    ...lookupUser,
  ]
  return await classesCollection.aggregate(agg).toArray();
}

const ClassesController = {
  getAll,
  getAvailableSlots,
  getByTutorId
}

export default ClassesController;