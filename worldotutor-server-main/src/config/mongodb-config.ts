import { GridFSBucket, MongoClient } from "mongodb";
require("dotenv").config();
const uri = process.env.MONGO_CLOUD_URI;
// const uri = process.env.MONGO_URL;

const client = new MongoClient(uri!);

async function connectToDatabase() {
  try {
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      `Connected successfully to ${uri?.startsWith("mongodb+srv") ? "Cloud" : "Local"
      } database`
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

async function getWotDb() {
  return client.db("wot");
}

const usersCollection = client.db("wot").collection("users");
const accountsCollection = client.db("wot").collection("accounts");
export const tutorsCollection = client.db("wot").collection("tutors");
export const superAdminCollection = client.db("wot").collection("superAdmin");
export const categoriesCollection = client.db("wot").collection("categories");
export const tutorRequestsCollection = client
  .db("wot")
  .collection("tutor-requests");
export const pricingCollection = client.db("wot").collection("pricing");
export const plansCollection = client.db("wot").collection("plans");
export const draftsCollection = client.db("wot").collection("drafts");
export const userTransactions = client.db("wot").collection("user-transactions");
export const legalCollection = client.db("wot").collection("legal");
export const imagesCollection = client.db("wot").collection("images");
export const bucket = new GridFSBucket(client.db("wot"), {
  bucketName: "files",
});

export const emailOTPCollection = client.db("wot").collection("email-otp");
export const tutorRequestsCol = client.db("wot").collection("tutor-requests");
export const userRequirementCol = client
  .db("wot")
  .collection("users-requirements");
export const recentlyViewedTutorsCol = client
  .db("wot")
  .collection("recently-viewed-tutors");
export const classesCollection = client.db("wot").collection("classes");
export const locationStatsCollection = client.db("wot").collection("location-stats")

export const messages = client.db("wot").collection("messages")
export const conversations = client.db("wot").collection("conversations")
export const chatSessions = client.db("wot").collection("user-chat-sessions")
export const enquiriesCollection = client.db("wot").collection("enquiries")

export const scheduleMeetTasks = client.db("wot").collection("schedule-meet-tasks");
export const scheduleEndMeetTasks = client.db("wot").collection("schedule-end-meet-tasks");
export const notifications = client.db("wot").collection("notifications");

export {
  connectToDatabase,
  getWotDb,
  client,
  usersCollection,
  accountsCollection,
};
