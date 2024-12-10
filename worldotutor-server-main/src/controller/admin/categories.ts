import { ObjectId } from "bson";
import { categoriesCollection, tutorsCollection } from "../../config/mongodb-config";

async function add(data: any) {
  data = data.map((element: any) => {
    return {
      ...element,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  const result = await categoriesCollection.insertMany(data);
  return result;
}

async function getById(id: string) {
  return await categoriesCollection.findOne({ _id: new ObjectId(id) });
}

async function getByType(type: string) {
  return await categoriesCollection.find({ type: type }).toArray();
}

async function update(data: any) {
  const filter = {
    _id: new ObjectId(data._id)
  }
  const result = await categoriesCollection.updateOne(filter, {
    "$set": {
      ...data.data
    }
  })
  return result;
}

async function getTutorsCountByCategoryType(categoryType: string) {
  let agg = [
    {
      $match: {
        "status": 'active',
        "profession.data.categoryType": categoryType,
      }
    },
    {
      $group: {
        _id: {
          name: "$profession.data.categories.name",
        },
      },
    },
    {
      $unwind: {
        path: "$_id.name",
      },
    },
    {
      $group: {
        _id: "$_id.name",
        count: {
          $sum: 1,
        },
      },
    },
  ]
  const result = await tutorsCollection.aggregate(agg).toArray();
  return result
}

//Search
async function searchCourses(searchPhrase: string) {
  const categoryPipeline = [
    {
      $search: {
        index: "category",
        text: {
          query: searchPhrase,
          path: {
            wildcard: "*"
          },
          fuzzy: {}
        }
      }
    }, {
      $project: {
        'category.name': 1,
      }
    }
  ]
  const courses = await categoriesCollection.aggregate(categoryPipeline).toArray();
  if (courses.length) {
    let courseNames = <string[]>[];
    courses.map((course) => courseNames.push(course.category.name))
    const tutors = await tutorsCollection.aggregate([{
      $match: {
        'profession.data.categories.name': { '$in': courseNames },
        status: 'active'
      }
    },
    {
      $sort: {
        createdAt: 1,
      },
    }]).toArray()
    return [...tutors]
  }
  else {
    return []
  }
}

export const Category = {
  add,
  getById,
  getByType,
  update,
  getTutorsCountByCategoryType,
  searchCourses
}