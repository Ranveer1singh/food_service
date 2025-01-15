import express from "express"
import { CreateVandor, GetVandor, GetVandorById } from "../controllers";

const router = express.Router();

router.post('/vandor',CreateVandor)
router.get('/vandor',GetVandor)
router.post('/vandor/:id',GetVandorById)


export { router as AdminRoute}