import { ObjectId } from "mongodb";
import { plansCollection, userTransactions, usersCollection } from "../../config/mongodb-config";
import { cancelPlan } from "../functions/cancelPlan";

async function getPaginatedPlans(filters: any, sortBy: any, page: any, resultsPerPage: any) {
  if (!sortBy.createdAt) {
    sortBy = { createdAt: -1 }
  }
  const data = await plansCollection.aggregate([
    { $match: { ...filters } },
    {
      $lookup: {
        'from': 'users',
        'let': {
          'userId': {
            '$toObjectId': '$userId'
          }
        },
        'as': 'user',
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$_id', '$$userId'
                ]
              }
            }
          },
          {
            '$project': {
              'name': 1,
              'email': 1,
              'phoneNumber': 1,
              'profilePic': 1,
              'timezone': 1,
              'createdAt': 1,
              'updatedAt': 1
            }
          }
        ],
      }
    },
    {
      '$set': {
        'user': {
          '$arrayElemAt': [
            '$user', 0
          ]
        }
      }
    },
    { $sort: sortBy ? sortBy : { createdAt: -1 } },
    { $skip: (page - 1) * resultsPerPage || 0 },
    { $limit: resultsPerPage || 5 }
  ]).toArray();
  const count = await plansCollection.countDocuments(filters);
  return {
    data,
    count
  }
}

async function getById(_id: string) {
  let filter = { _id: new ObjectId(_id) };
  const result = await plansCollection.aggregate([{
    '$match': {
      '$expr': {
        '$eq': [
          "$_id", new ObjectId(_id)
        ]
      }
    }
  },
  {
    '$lookup': {
      'from': 'users',
      'let': {
        'userId': {
          '$toObjectId': '$userId'
        }
      },
      'as': 'user',
      'pipeline': [
        {
          '$match': {
            '$expr': {
              '$eq': [
                '$_id', '$$userId'
              ]
            }
          }
        },
        {
          '$project': {
            'name': 1,
            'email': 1,
            'phoneNumber': 1,
            'profilePic': 1,
            'timezone': 1,
            'createdAt': 1,
            'updatedAt': 1
          }
        }
      ],
    },
  },
  {
    '$lookup': {
      'from': 'tutors',
      'let': {
        'tutorId': {
          '$toObjectId': '$tutorId'
        }
      },
      'as': 'tutor',
      'pipeline': [
        {
          '$match': {
            '$expr': {
              '$eq': [
                '$_id', '$$tutorId'
              ]
            }
          }
        },
        {
          '$project': {
            'personal.data.name': 1,
            'personal.data.profilePic': 1,
            'agreement.level': 1,
          }
        }
      ],
    },
  },
  {
    '$lookup': {
      'from': 'tutors',
      'let': {
        'prevTutorId': {
          '$toObjectId': '$prevTutorId'
        }
      },
      'as': 'prevTutor',
      'pipeline': [
        {
          '$match': {
            '$expr': {
              '$eq': [
                '$_id', '$$prevTutorId'
              ]
            }
          }
        },
        {
          '$project': {
            'personal.data.name': 1,
            'personal.data.profilePic': 1,
            'agreement.level': 1,
          }
        }
      ],
    },
  },
  {
    '$set': {
      'user': {
        '$arrayElemAt': [
          '$user', 0
        ]
      },
      'tutor': {
        '$arrayElemAt': [
          '$tutor', 0
        ]
      },
      'prevTutor': {
        'arrayElemAt': [
          '$prevTutor', 0
        ]
      }
    }
  }
  ]).toArray();
  return result
}

async function getPaginatedChangeRequests(filters: any, sortBy: any, page: any, resultsPerPage: any) {
  const data = await plansCollection.aggregate([
    {
      $match: {
        "changeRequest": { $exists: true },
        ...filters
      }
    },
    {
      $lookup: {
        'from': 'users',
        'let': {
          'userId': {
            '$toObjectId': '$userId'
          }
        },
        'as': 'user',
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$_id', '$$userId'
                ]
              }
            }
          },
          {
            '$project': {
              'name': 1,
              'email': 1,
              'phoneNumber': 1,
              'profilePic': 1,
              'timezone': 1,
              'createdAt': 1,
              'updatedAt': 1
            }
          }
        ],
      }
    },
    {
      '$set': {
        'user': {
          '$arrayElemAt': [
            '$user', 0
          ]
        }
      }
    },
    { $sort: sortBy ? sortBy : { createdAt: -1 } },
    { $skip: (page - 1) * resultsPerPage || 0 },
    { $limit: resultsPerPage || 5 }
  ]).toArray();

  const count = await plansCollection.countDocuments({
    "changeRequest": { $exists: true },
    ...filters
  });
  return {
    data,
    count
  }
}

async function updatePlanStatus(_id: string, status: string) {
  await plansCollection.updateOne({ _id: new ObjectId(_id) }, {
    $set: {
      "status": status,
      "paymentDetails.status": "paid",
      "updatedAt": new Date()
    }
  });
  const res = plansCollection.findOne({ _id: new ObjectId(_id) });
  return res;
}

async function updatePlanPaymentStatus(_id: string, status: string) {
  const plan = await plansCollection.findOne({ _id: new ObjectId(_id) });
  if (!plan) return null;
  const user = await usersCollection.findOne({ _id: new ObjectId(plan.userId) })
  if (!user) return null;

  const newTransaction = {
    amount: Math.round(plan.totalCost),
    currency: 'inr',
    planId: plan._id,
    status: "succeeded",
    user: {
      _id: user?._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber
    },
    paymentMethod: "cash",
    modeOfPayment: "cash",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const transaction = await userTransactions.insertOne(newTransaction)

  await plansCollection.updateOne({ _id: new ObjectId(_id) }, {
    $set: {
      "paymentDetails.transactionId": transaction.insertedId.toString(),
      "paymentDetails.status": status,
      "updatedAt": new Date()
    }
  });
  const res = plansCollection.findOne({ _id: new ObjectId(_id) });
  return res;
}

async function updatePlan(_id: string, data: any) {
  await plansCollection.updateOne({ _id: new ObjectId(_id) }, {
    $set: {
      ...data,
      "updatedAt": new Date()
    }
  });
  const res = plansCollection.findOne({ _id: new ObjectId(_id) });
  return res;
}

async function cancel(id: string) {
  return await cancelPlan({ _id: new ObjectId(id) });
}

async function handleChangeRequest(_id: string, status: 'rejected' | 'approved') {
  let filter = { _id: new ObjectId(_id) };
  if (status === 'rejected') {
    await plansCollection.updateOne(filter, {
      $set: {
        "changeRequest.status": 'rejected',
        "changeRequest.updatedAt": new Date(),
        updatedAt: new Date()
      }
    })
    const document = await plansCollection.findOne(filter);
    return document;
  } else {
    //update change request Status
    const currentPlan = await plansCollection.findOneAndUpdate(filter, {
      $set: {
        "changeRequest.status": 'approved',
        "changeRequest.updatedAt": new Date(),
        updatedAt: new Date()
      }
    });

    //cancel existing plan
    await cancelPlan({ _id: new ObjectId(_id) });
    const document = await plansCollection.findOne(filter);
    return document;
    // //create new plan
    // if (currentPlan && currentPlan.value) {
    //     const newPlan = {
    //         userId: currentPlan.value.userId,
    //         prevPlanId: currentPlan.value._id.toString(),
    //         prevTutorId: currentPlan.value.tutorId,
    //         categoryType: currentPlan.value.categoryType,
    //         category: currentPlan.value.category,
    //         puchasedSessions: currentPlan.value.purchasedSessions,//TODO: To be fixed
    //         totalSessions: currentPlan.value.totalSessions,
    //         // costPerSession: currentPlan.costPerSession,
    //         status: 'pending',
    //         totalCost: currentPlan.value.totalCost,
    //         tutorPayment: currentPlan.value.tutorPayment,
    //         paymentDetails: currentPlan.value.paymentDetails
    //     }

    //     //insert new plan
    //     const result = plansCollection.insertOne({
    //         ...newPlan,
    //         status: 'pending',
    //         createdAt: new Date(),
    //         updatedAt: new Date()
    //     })
    // return result;
    // }
  }
}

const PlansController = {
  getPaginatedPlans,
  getById,
  getPaginatedChangeRequests,
  handleChangeRequest,
  updatePlanStatus,
  updatePlanPaymentStatus,
  updatePlan,
  cancel
}

export default PlansController