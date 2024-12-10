import { ObjectId } from "mongodb";
import { usersCollection } from "../../config/mongodb-config";

//add user
async function add(body: any) {
  const document = await usersCollection.findOne({ email: body.email });
  if (document) {
    return document;
  }
  const result = await usersCollection.insertOne({
    ...body,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  //TODO: Send an invitation email
  return { _id: result.insertedId, ...body };
}

//get all users
// async function get() {
//   const result = await usersCollection.find({}).toArray();
//   return result;
// }

//get all users by any filter
async function getAll(status?: string) {
  let filter = {};
  if (status) {
    filter = { status: status };
  }
  const result = await usersCollection
    .find(filter, { sort: { createdAt: 1 } })
    .toArray();
  return result;
}

//get user by Id
async function getById(_id: string) {
  let filter = { _id: new ObjectId(_id) };
  const result = await usersCollection.findOne(filter);
  return result;
}

//get user by email
async function getByEmail(email: string) {
  let filter = { email: email };
  const result = await usersCollection.findOne(filter);
  return result;
}

// update user
async function update(body: any) {
  let filter = { _id: new ObjectId(body._id) };
  await usersCollection.updateOne(filter, {
    $set: {
      ...body.data,
      updatedAt: new Date(),
    },
  });
  const document = await usersCollection.findOne(filter);
  return document;
}

const UserController = {
  add,
  getAll,
  // get,
  getById,
  getByEmail,
  update,
};

export default UserController;
