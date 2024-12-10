import { ObjectId } from "mongodb";
import { classesCollection, draftsCollection, plansCollection, scheduleMeetTasks } from "../../config/mongodb-config";
import { DEFAULT_TUTOR_PAYMENT, MINUTES_BEFORE_ZOOM_TRIGGER, SCHEDULED_TASK_TYPE } from "../../utils/constants";
import { cancelPlan } from "../functions/cancelPlan";
import { createTask } from "../functions/taskScheduler";
import SessionController from "./session";

export interface AddPlanPayload {
  userId: string,
  tutorId: string,
  categoryType: string,
  category: {
    name: string[],
    grade: string,
    board: string
  },
  purchasedSessions: number,
  totalSessions: number,
  costPerSession: number,
  status: string,
  discount: number,
  totalCost: number,
  paymentDetails: {
    paymentMethod: string,
    transactionId: string,
    status: string
  }
}

export interface ExtendPlanPayload {
  basePlanId: string,
  purchasedSessions: number,
  totalSessions: number,
  costPerSession: number,
  status: string,
  discount: number,
  totalCost: number,
  paymentDetails?: {
    paymentMethod: string,
    transactionId?: string,
    status: string
  }
}

//called after payment is successful
async function create(body: any) {
  const result = await plansCollection.insertOne({
    ...body,
    tutorPayment: DEFAULT_TUTOR_PAYMENT,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return plansCollection.findOne({ _id: result.insertedId });
}

//called when plan is extended, paid in cash
async function extend(body: any) {
  const filter = { _id: new ObjectId(body.basePlanId) };
  const result = await plansCollection.insertOne({
    ...body,
    _id: new ObjectId(),
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  // plansCollection.updateOne(filter, {
  //   $set: { updatedAt: new Date() },
  //   $addToSet: { extendedPlanIds: result?.insertedId }
  // })
  return plansCollection.findOne({ _id: result.insertedId });
}

//called when purchase plan online payment is initiated
async function addPlanDraft(body: AddPlanPayload) {
  let data = {
    ...body,
    tutorPayment: DEFAULT_TUTOR_PAYMENT,
    extendedPlanIds: [],
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const result = await draftsCollection.insertOne(data);
  const insertedPlan = await draftsCollection.findOne({ _id: result.insertedId })
  // const result = await plansCollection.insertOne(data);
  // const insertedPlan = await plansCollection.findOne({ _id: result.insertedId })
  return insertedPlan;
}

//called when extend plan online payment is initiated
async function extendPlanDraft(body: ExtendPlanPayload) {
  const filter = { _id: new ObjectId(body.basePlanId) };
  let data = {
    ...body,
    tutorPayment: DEFAULT_TUTOR_PAYMENT,
    _id: new ObjectId(),
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const result = await draftsCollection.insertOne(data);
  const insertedPlan = await draftsCollection.findOne({ _id: result.insertedId })
  // plansCollection.updateOne(filter, {
  //   $set: { updatedAt: new Date() },
  //   $addToSet: { extendedPlanIds: insertedPlan?._id }
  // })
  return insertedPlan;
}

async function changeRequest(body: any) {
  console.log(body)
  const { planId, reason } = body;
  const filter = { _id: new ObjectId(planId) }
  const result = await plansCollection.updateOne(filter, {
    $set: {
      changeRequest: {
        fulfilled: false,
        status: "pending",
        reason: reason,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      updatedAt: new Date()
    }
  })
  return await plansCollection.findOne(filter);
}

async function deleteChangeRequest(planId: string) {
  const result = await plansCollection.updateOne({ _id: new ObjectId(planId) }, {
    $unset: {
      changeRequest: ''
    }
  })

  return result;
}

async function get(userId: string) {
  const result = await plansCollection.aggregate([
    {
      $match: {
        $expr: {
          $eq: [
            "$userId",
            userId
          ],
        },
      },
    },
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
              profilePic:
                "$personal.data.profilePic",
              level: '$agreement.level'
            },
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
    {
      $sort: { createdAt: -1 }
    }
  ]).toArray();
  return result
}

async function getById(planId: string) {
  const result = await plansCollection.aggregate([
    {
      $match: {
        $expr: {
          $eq: [
            "$_id",
            new ObjectId(planId)
          ],
        },
      },
    },
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
              profilePic:
                "$personal.data.profilePic",
              level: '$agreement.level'
            },
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
    {
      $sort: { createdAt: -1 }
    }
  ]).toArray();
  return result
}



async function addSessions(body: any) {
  const plan = await plansCollection.findOne({ _id: new ObjectId(body[0].planId) });
  const tutorPayment = plan?.tutorPayment || DEFAULT_TUTOR_PAYMENT
  const sessions = body.map((session: any) => ({
    ...session,
    tutorPayment,
  }))
  for (const session of sessions) {
    const result = await SessionController.add(session);
    if (result) {
      await plansCollection.updateOne({ _id: new ObjectId(session.planId) }, {
        $addToSet: {
          sessions: result._id
        }
      })
    } else {
      return null;
    }
  }
}

async function cancel(id: string) {
  return await cancelPlan({ _id: new ObjectId(id) });
}

// remove
async function getSessions(planId: string) {
  return await classesCollection.find({ planId: planId }).toArray();
}


async function getPlansAttendance(userId: string) {
  let agg = [
    {
      $match: {
        $expr: {
          $eq: [
            "$userId",
            userId,
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
                    profilePic:
                      "$personal.data.profilePic",
                    level: '$agreement.level'
                  },
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
                    profilePic:
                      "$personal.data.profilePic",
                    level: '$agreement.level'
                  },
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
  return result[0];
}


async function getPlanSuggestedTutors(planId: string) {
  return await plansCollection.aggregate([
    {
      $match: {
        _id: new ObjectId(planId),
      },
    },
    {
      $lookup: {
        from: "tutors",
        let: {
          tutorId: "$tutorId",
        },
        as: "tutor",
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  "$_id",
                  {
                    $toObjectId: "$$tutorId",
                  },
                ],
              },
            },
          },
          {
            $project: {
              tutorCategory: "$agreement.level",
            },
          },
        ],
      },
    },
    {
      $set: {
        tutor: {
          $arrayElemAt: ["$tutor", 0],
        },
      },
    },
    {
      $lookup: {
        from: "tutors",
        let: {
          categoryType: "$categoryType",
          categoryList: "$category.name",
          category: "$tutor.tutorCategory",
          grade: "$category.grade",
          board: "$category.board",
          type: "$category.type",
          level: "$category.level",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [
                      "$agreement.level",
                      "$$category",
                    ],
                  },
                  {
                    $eq: [
                      "$profession.data.categoryType",
                      "$$categoryType",
                    ],
                  },
                  {
                    $or: [
                      {
                        $and: [
                          {
                            $setIsSubset: [
                              "$$categoryList",
                              "$profession.data.categories.name",
                            ],
                          },
                          {
                            $gte: [
                              {
                                $size: {
                                  $filter: {
                                    input:
                                      "$profession.data.categories.board.grades",
                                    as: "grades",
                                    cond: {
                                      $in: [
                                        "$$grade",
                                        "$$grades",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          {
                            $gte: [
                              {
                                $size: {
                                  $filter: {
                                    input:
                                      "$profession.data.categories.board.name",
                                    as: "boards",
                                    cond: {
                                      $in: [
                                        "$$board",
                                        "$$boards",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $setIsSubset: [
                              "$$categoryList",
                              "$profession.data.categories.name",
                            ],
                          },
                          {
                            $gte: [
                              {
                                $size: {
                                  $filter: {
                                    input:
                                      "$profession.data.categories.types",
                                    as: "types",
                                    cond: {
                                      $in: [
                                        "$$type",
                                        "$$types.name",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          {
                            $gte: [
                              {
                                $size: {
                                  $filter: {
                                    input:
                                      "$profession.data.categories.types",
                                    as: "types",
                                    cond: {
                                      $in: [
                                        ["$$level"],
                                        "$$types.levels",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    $eq: ["$status", "active"],
                  },
                ],
              },
            },
          },
        ],
        as: "suggestedTutors",
      },
    }
  ]).toArray();
}

async function assignNewTutor(planId: string, tutorId: string) {
  const currentPlan = await plansCollection.findOne({ _id: new ObjectId(planId) });
  if (currentPlan) {
    //create new plan
    const classList = await classesCollection.find({ planId: currentPlan._id.toString(), status: "completed" }).toArray();

    if (currentPlan) {
      let { _id, changeRequest, status, tutorPayment, sessions, extendedPlanIds, ...newPlan } = currentPlan;
      newPlan = {
        ...newPlan,
        status: "active",
        tutorId: tutorId,
        prevPlanId: currentPlan._id.toString(),
        prevTutorId: currentPlan.tutorId,
        tutorPayemnt: DEFAULT_TUTOR_PAYMENT,
        purchasedSessions: currentPlan.purchasedSessions - classList.length,
        totalSessions: currentPlan.totalSessions - classList.length,
        totalCost: (currentPlan.costPerSession * (currentPlan.purchasedSessions - classList.length) * (100 - currentPlan.discount)) / 100
      }

      //insert new plan
      const insertedPlan = await plansCollection.insertOne({
        ...newPlan,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      // update the current plan
      await plansCollection.updateOne({ _id: new ObjectId(planId) }, {
        $set: {
          "status": "cancelled",
          "changeRequest.fulfilled": true,
          updatedAt: new Date()
        }
      });

      return { _id: insertedPlan.insertedId, ...newPlan };
    }
  }
}




const PlansController = {
  create,
  addPlanDraft,
  get,
  getById,
  addSessions,
  extend,
  extendPlanDraft,
  changeRequest,
  cancel,
  getSessions,
  getPlansAttendance,
  getPlanAttendance,
  deleteChangeRequest,
  getPlanSuggestedTutors,
  assignNewTutor
}

export default PlansController