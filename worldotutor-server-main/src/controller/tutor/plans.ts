import { classesCollection, plansCollection } from "../../config/mongodb-config";

async function get(tutorId: string) {
  const result = await plansCollection.aggregate([
    {
      $match: {
        $expr: {
          $eq: [
            "$tutorId",
            tutorId
          ],
        },
      },
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
              profilePic: 1
            },
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
  ]).toArray();
  return result
}


async function getByStudentId(tutorId: string, studentId: string) {
  const result = await plansCollection.aggregate([
    {
      $match: {
        $expr: {
          $and: {

            $eq: [
              "$tutorId",
              tutorId
            ],

          },
          $eq: [
            "$userId",
            studentId
          ],

        },
      },
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
              profilePic: 1
            },
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
  ]).toArray();
  console.log(result)
  return result
}



async function getStudents(tutorId: string) {
  const result = await plansCollection.aggregate(
    [
      {
        $match: {
          $expr: {
            $eq: [
              "$tutorId",
              tutorId,
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            userId: {
              $toObjectId: "$userId",
            },
          },
          as: "user",
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
                prefrences: 0,
              },
            },
            {
              $limit: 1,
            },
          ],
        },
      },
      {
        $project: {
          user: {
            $arrayElemAt: ["$user", 0],
          },
          category: "$category",
          categoryType: "$categoryType",
          status: "$status"
        },
      },
    ]
  ).toArray();
  return result;
}


async function getPlansAttendance(tutorId: string) {
  let agg = [
    {
      $match: {
        $expr: {
          $eq: [
            "$tutorId",
            tutorId,
          ],
        },
        type: "plan"
      },
    },
    {
      $group: {
        _id: "$planId",
        sessions: {
          $push: "$$ROOT",
        },
      },
    },
    {
      $lookup: {
        from: "plans",
        let: {
          planId: {
            $toObjectId: "$_id",
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$planId"],
              },
            },
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
        ],
        as: "plan",
      },
    },
    {
      $set: {
        plan: {
          $arrayElemAt: ["$plan", 0],
        },
      },
    },
  ]
  return await classesCollection.aggregate(agg).toArray();
}

async function getPlanAttendance(planId: string) {
  let agg = [
    {
      $match: {
        $expr: {
          $eq: [
            "$planId",
            planId,
          ],
        },
        type: "plan"
      },
    },
    {
      $group: {
        _id: "$planId",
        sessions: {
          $push: "$$ROOT",
        },
      },
    },
    {
      $lookup: {
        from: "plans",
        let: {
          planId: {
            $toObjectId: "$_id",
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$planId"],
              },
            },
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
        ],
        as: "plan",
      },
    },
    {
      $set: {
        plan: {
          $arrayElemAt: ["$plan", 0],
        },
      },
    },
  ]
  const result = await classesCollection.aggregate(agg).toArray();
  console.log(result)
  return result[0];
}

const TutorPlanController = {
  get,
  getByStudentId,
  getStudents,
  getPlanAttendance,
  getPlansAttendance
}

export default TutorPlanController