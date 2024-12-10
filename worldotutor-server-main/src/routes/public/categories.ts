import express from 'express';
import { Category } from '../../controller/admin/categories';
import { ResponseApi } from '../../core/response';

const router = express.Router();

router.get("/categories", async (req, res) => {
  const { type } = req.query;
  if (typeof type === 'string') {
    const result = await Category.getByType(type);
    ResponseApi(res, {
      status: "OK",
      data: result
    })
  }
})

router.get("/categories/:_id", async (req, res) => {
  const { _id } = req.params
  const result = await Category.getById(_id);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

router.get("/tutors-count/:categoryType", async (req, res) => {
  const result = await Category.getTutorsCountByCategoryType(req.params.categoryType);
  ResponseApi(res, {
    status: "OK",
    data: result
  })
})

//Search
router.get('/search/categories/:searchText', async (req, res) => {
  const { searchText } = req.params;
  const result = await Category.searchCourses(searchText);
  ResponseApi(res, {
    status: 'OK',
    message: `${result.length} Courses Found`,
    data: result,
  });
});

export default router;