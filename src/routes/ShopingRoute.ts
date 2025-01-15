import express , {Request, Response, NextFunction} from 'express';
import { GetFoodAvailability, GetFoodIn30Min, GetTopRestaurant, RestuarantByID, SearchFoods } from '../controllers/ShoppingController';

const router = express.Router();


/**-------------Food Availability-------------- */
router.get('/:pincode',GetFoodAvailability)


/**-------------Top Restaurant-------------- */
router.get('top-restuarant/:pincode',GetTopRestaurant)

/**-------------Food Available in 30 Minutes-------------- */
router.get('food-in-30-min/:pincode',GetFoodIn30Min)

/**-------------Search Food -------------- */
router.get('search/:pincode',SearchFoods)

/**-------------Find Resuatrant By Id-------------- */
router.get('restuarant/:id',RestuarantByID)

export {router as ShopingRoute}