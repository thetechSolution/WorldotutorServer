import { ObjectID } from "bson";
import { accountsCollection, legalCollection } from "../../config/mongodb-config";

async function insert(data: any) {
  data = {
    ...data,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const result = await legalCollection.insertOne(data);
  const found = await getById(result.insertedId);
  // await accountsCollection.updateMany({
  //   $or: [
  //     { termsOfUse: "accepted" },
  //     { termsOfUse: "declined" }
  //   ]
  // }, {
  //   $set: {
  //     termsOfUse: "pending"
  //   }
  // })
  return found
}

async function getOfType(type: any) {
  const result = await legalCollection.find({ type: type }, { sort: { createdAt: -1 } }).toArray();
  return result;
}

async function getById(_id: Object) {
  const result = await legalCollection.findOne({ _id: _id });
  return result;
}

async function update(data: any) {
  const result = await legalCollection.updateOne(
    { _id: new ObjectID(data._id) },
    { $set: { "status": data.status, "updatedAt": new Date() } });
  const found = await getById(new ObjectID(data._id));
  return found
}


const Legal = {
  insert,
  update,
  getOfType,
  getById
}

export default Legal