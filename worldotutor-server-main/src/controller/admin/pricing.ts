import { ObjectID } from "bson";
import { pricingCollection } from "../../config/mongodb-config"


async function addPricing(data: any) {
  data = {
    ...data,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const result = await pricingCollection.insertOne(data)
  const found = await getPricing("", result.insertedId);
  return found
}

async function udpdatePricing(_id: string, data: any) {
  const result = await pricingCollection.updateOne(
    { _id: new ObjectID(data._id) },
    { $set: { "pricing": data.pricing, "updatedAt": new Date() } })
  const found = await getPricing("", new ObjectID(_id));
  return found
}

async function getPricing(type: string, _id?: ObjectID) {
  if (type) {
    const result = await pricingCollection.findOne({ type: type, status: "active" });
    return result;
  }
  if (_id) {
    const result = await pricingCollection.findOne({ _id: _id, status: "active" });
    return result;
  }
}

async function getPricingOf(categoryType: string, grade: string | null, level: string | null, tutorType: string) {
  if (categoryType === "subject" && grade) {
    const pricing = await pricingCollection.findOne({ type: categoryType });
    if (!pricing) return null;
    return pricing.pricing.grades[grade][tutorType];
  }
  if (categoryType === "hobby" && level) {
    const pricing = await pricingCollection.findOne({ type: categoryType });
    if (!pricing) return null;
    return pricing.pricing.levels[level][tutorType];
  }
  if (categoryType === "skill" && level) {
    const pricing = await pricingCollection.findOne({ type: categoryType });
    if (!pricing) return null;
    return pricing.pricing.levels[level][tutorType];
  }
}



export const Pricing = {
  addPricing,
  getPricing,
  udpdatePricing,
  getPricingOf
}