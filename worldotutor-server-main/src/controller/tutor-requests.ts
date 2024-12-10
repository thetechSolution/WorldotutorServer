import { ObjectId } from "mongodb";
import { client, tutorRequestsCol, tutorsCollection } from "../config/mongodb-config";

async function getAll(filters: any, sortBy: any, resultsPerPage: number, page: number) {
  const results = await tutorRequestsCol.aggregate([
    { $match: { status: { $ne: "pending" } } },
    { $match: { ...filters } },
    { $sort: sortBy ? sortBy : { createdAt: -1 } },
    { $skip: (page - 1) * resultsPerPage || 0 },
    { $limit: resultsPerPage || 5 }
  ]).toArray();
  const count = await tutorRequestsCol.countDocuments({ status: { $ne: "pending" }, ...filters });
  return {
    results,
    count: count
  }
}

async function getById(tutor_id: string) {
  const result = await tutorRequestsCol.findOne({ _id: new ObjectId(tutor_id) });
  return result
}

async function getByAccountId(id: string) {
  const result = await tutorRequestsCol.findOne({ account_id: id });
  return result;
}

async function createNewTutorRequest(id: string) {
  const tutor_req = await tutorRequestsCol.findOne({ account_id: id });
  if (tutor_req) {
    return tutor_req;
  }
  await tutorRequestsCol.insertOne({
    account_id: id,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const result = await tutorRequestsCol.findOne({ account_id: id });
  return result;
}

async function updateByAccountId(data: any) {
  const filter = { account_id: data.account_id };
  const update = {
    "$set": {
      ...data,
      updatedAt: new Date()
    }
  };
  const profile = await tutorRequestsCol.findOneAndUpdate(filter, update);
  if (!profile.value) {
    data = {
      ...data,
      status: "pending",
      seen: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await tutorRequestsCol.insertOne(data);
  }
  const result = await tutorRequestsCol.findOne(filter);
  return result;

}

async function update(data: any) {
  let filter = { _id: new ObjectId(data._id) };
  let update = {
    "$set": {
      ...data.data,
      updatedAt: new Date()
    }
  }
  const profile = await tutorRequestsCol.findOneAndUpdate(filter, update);
  if (!profile.value) {
    data = {
      ...data.data,
      status: "pending",
      seen: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await tutorRequestsCol.insertOne(data);
    return result;
  }
  else return profile;
}

async function updateAgreement(data: any) {
  let filter = { _id: new ObjectId(data._id) };
  const result1 = await tutorRequestsCol.findOne(filter);
  if (result1 && result1.agreement) {
    let update = {
      "$set": {
        agreement: {
          ...result1.agreement,
          ...data.data.agreement,
          updatedAt: new Date(),
        },
        updatedAt: new Date()
      }
    }
    const result = await tutorRequestsCol.findOneAndUpdate(filter, update);
    return result
  } else {
    let update = {
      "$set": {
        agreement: {
          ...data.data.agreement,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        updatedAt: new Date()
      }
    }
    const result = await tutorRequestsCol.findOneAndUpdate(filter, update)
    return result.value
  }
}

async function acceptAgreement(data: any) {
  const session = client.startSession();
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };
  try {
    return await session.withTransaction(async () => {
      // Change agreement status to accpeted
      const filter = { _id: new ObjectId(data._id) }
      const update = {
        "$set": {
          "agreement.status": "accepted",
          "status": "verified",
          "updatedAt": new Date()
        }
      }
      await tutorRequestsCol.updateOne(filter, update, { session });

      // Create a new tutor in tutors collection with tutor data
      const tutorRequest = await tutorRequestsCol.findOne(filter, { session });
      const newTutor = {
        _id: tutorRequest?._id,
        account_id: tutorRequest?.account_id,
        personal: tutorRequest?.personal,
        education: tutorRequest?.education,
        experience: tutorRequest?.experience,
        profession: tutorRequest?.profession,
        completed: false,
        prefrences: {
          lessonUpdates: false,
          accountUpdates: true,
          currency: {
            code: "INR",
            name: "Indian rupee",
            symbol: "₹"
          },
          timezone: "Asia/Calcutta",
        },
        agreement: tutorRequest?.agreement,
        status: "in-active",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result1 = await tutorsCollection.insertOne(newTutor, { session, writeConcern: { w: 'majority' } })
      // Delete tutor request
      await tutorRequestsCol.deleteOne(filter, { session, writeConcern: { w: 'majority' } })
      return result1.insertedId;
    })
  } finally {
    await session.endSession();
  }
}

const TutorRequestsController = {
  getAll,
  getById,
  getByAccountId,
  createNewTutorRequest,
  update,
  updateByAccountId,
  updateAgreement,
  acceptAgreement
}

export default TutorRequestsController;