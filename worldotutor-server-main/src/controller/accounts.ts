import { ObjectId } from "mongodb"
import { accountsCollection } from "../config/mongodb-config"

async function update(data: any, id: string) {
  const fitler = { _id: new ObjectId(id) }
  const query = {
    "$set": {
      ...data,
      updatedAt: new Date()
    }
  }
  const result = await accountsCollection.findOneAndUpdate(fitler, query)
  return result
}

const AccountsController = {
  update
}

export default AccountsController;