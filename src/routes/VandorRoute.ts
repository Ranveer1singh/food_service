import express , {Response,Request, NextFunction} from "express"
import { AddFood, CreateOrder, GetCurrentOrders, GetFood, GetVandor, GetVandorProfile, UpdateVendorCoverImage, UpdateVendorProfile, UpdateVendorService, VandorLogin } from "../controllers";
import { Authenticate } from "../middlewares";
import { images } from "../utility";


const router = express.Router();



router.post('/login',VandorLogin)

router.use(Authenticate)
router.get('/profile',GetVandorProfile)
router.patch('/profile',UpdateVendorProfile)
router.patch('/service',UpdateVendorService)
router.patch('/coverimage',images ,UpdateVendorCoverImage)

router.patch('/food',images ,AddFood)
router.patch('/food',GetFood)
router.post('/food',GetCurrentOrders)



export { router as VandorRoute}