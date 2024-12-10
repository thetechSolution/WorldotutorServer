import { superAdminCollection, tutorRequestsCol } from "../config/mongodb-config";

async function getSuperAdmin(email: string) {
  const result = await superAdminCollection.findOne({ email: email });
  return result
}

async function addSuperAdmin(email: string, hashedPassword: string) {
  const user = {
    email: email,
    password: hashedPassword,
  };
  const result = await superAdminCollection.insertOne(user);
  return result
}

async function getTutorRequest(filter: any) {
  const result = await tutorRequestsCol.find(filter).toArray();
  return result;
}


const Admin = {
  getSuperAdmin,
  addSuperAdmin,
  getTutorRequest
}

export default Admin