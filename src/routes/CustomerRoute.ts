import express from "express"
import { CreateOrder, CustomerLogin, CustomerSignUp, CustomerVerify, EditCustomerProfile, GetCustomerProfile, GetOrderById, GetOrders } from "../controllers";
import { Authenticate } from "../middlewares";

const router = express.Router();


/*------------ SingUp / Create Customer-------------- */
router.post('/signup',CustomerSignUp)
/*------------ Login-------------- */
router.post('/login', CustomerLogin)
/*------------ Varify Customer Account-------------- */

router.use(Authenticate )
router.patch('/verify', CustomerVerify)
/*------------ OTP / OTP Request-------------- */
router.post('/otp', )
/*------------ Profile-------------- */
router.get('/profile',GetCustomerProfile)
router.patch('/profile',EditCustomerProfile)

/*----------- order---------- */
router.post('/create-order',CreateOrder)
router.get('/get-orders',GetOrders)
router.get('/get-order/:id',GetOrderById)
export {router as CustomerRoute}