import express , {Request, Response, NextFunction} from 'express';
import { Vandor } from '../models';
import { FoodDoc } from '../models/Food.model';

export const GetFoodAvailability = async (req : Request, res : Response, next : NextFunction) =>{

    const pincode = req.params.pincode;

    const result = await Vandor.find({pincode : pincode, serviceAvailable:false}).
    sort([["rating", 'descending']]).
    populate('foods')

    if(result.length > 0){
        res.status(200).json(result);
    }

    res.status(400).json({
        message : "Data Not Found"
    })
}
export const GetTopRestaurant = async (req : Request, res : Response, next : NextFunction) =>{

    const pincode = req.params.pincode;

    const result = await Vandor.find({pincode : pincode, serviceAvailable:false}).
    sort([["rating", 'descending']]).
    limit(10)

    if(result.length > 0){
        res.status(200).json(result);
    }

    res.status(400).json({
        message : "Data Not Found"
    })

}
export const GetFoodIn30Min = async (req : Request, res : Response, next : NextFunction) =>{
    const pincode = req.params.pincode;

    const result = await Vandor.find({pincode : pincode, serviceAvailable:false}).
    populate('foods')

    if(result.length > 0){

        let foodResult : any = [];
        result.map(vandor => {
            const foods = vandor.foods as [FoodDoc]

            foodResult.push(...foods.filter(food => food.readyTime <= 30))
        })
        res.status(200).json(foodResult);
    }

    res.status(400).json({
        message : "Data Not Found"
    })
}
export const SearchFoods = async (req : Request, res : Response, next : NextFunction) =>{

    const pincode = req.params.pincode;

    const result = await Vandor.find({pincode : pincode, serviceAvailable:false}).
    populate('foods')

    if(result.length > 0){
        let foodResult:any = [];

        result.map(item => foodResult.push(...item.foods))
        res.status(200).json(foodResult);
    }

    res.status(400).json({
        message : "Data Not Found"
    })
}
export const RestuarantByID = async (req : Request, res : Response, next : NextFunction) =>{
    const id = req.params.id;

    const result = await Vandor.findById(id).populate('foods')

    if(result){
        res.status(200).json(result);
    }

    res.status(400).json({
        message : "Data Not Found"
    })
}