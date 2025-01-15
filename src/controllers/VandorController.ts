import express, { Response, Request, NextFunction } from "express"
import { CreateOfferInputs, EditVandorInput, VandorLoginInput } from "../dto"
import { FindVandor } from "./AdminController";
import { GenerateSignature, ValidatePassword } from "../utility";
import { CreatFoodInput } from "../dto/Food.dto";
import { Food } from "../models/Food.model";
import { Order } from "../models/Order.model";
import { Offer } from "../models/Offer.model";

export const VandorLogin = async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body as VandorLoginInput;
      
        try {
          // Validate input
          if (!email || !password) {
             res.status(400).json({ message: 'Email and password are required' });
          }
      
          // Check if the vendor exists
          const existingVandor = await FindVandor('', email);
      
          if (!existingVandor) {
             res.status(404).json({ message: 'Vendor not found' });
          }
      
          // Validate password
          const isPasswordValid = await ValidatePassword(password, existingVandor.password, existingVandor.salt);
          if (!isPasswordValid) {
             res.status(400).json({ message: 'Incorrect password' });
          }
      
          // Generate JWT token
          const token = GenerateSignature({
            _id: existingVandor.id,
            name: existingVandor.name,
            email: existingVandor.email,
            foodType: existingVandor.foodType,
          });
      
          // Respond with the token
           res.status(200).json({ token, message: 'Login successful' });
        } catch (error) {
          next(error); // Forward the error to the error handling middleware
        }
}


export const GetVandorProfile = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (user) {
        const existingUser = await FindVandor(user._id)
        res.json(existingUser)
    }
    res.json({
        message: "not found"
    })
}

export const UpdateVendorProfile = async (req: Request, res: Response, next: NextFunction) => {

    const { name, foodType, address, phone } = <EditVandorInput>req.body
    const user = req.user;

    if (user) {
        const existingUser = await FindVandor(user._id)

        if (existingUser !== null) {
            existingUser.foodType = foodType,
                existingUser.name = name,
                existingUser.address = address,
                existingUser.phone = phone

            const savedResult = await existingUser.save();
            res.json(savedResult)
        }
        res.json(existingUser)
    }
    res.json({
        message: "not found"
    })
}

export const UpdateVendorCoverImage = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (user) {

        const vandor = await FindVandor(user._id);

        if (vandor !== null) {

            const files = req.files as [Express.Multer.File];

            const images = files.map((file: Express.Multer.File) => file.filename)
            vandor.coverImage.push(...images);
            const result = await vandor.save;
            res.status(201).json({
                message: "record created",
                data: result
            })

        }
    }
    res.json("something went worng with add food")

}

export const UpdateVendorService = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if (user) {
        const existingUser = await FindVandor(user._id)

        if (existingUser !== null) {
            existingUser.serviceAvailable = !existingUser.serviceAvailable;

            const savedResult = await existingUser.save();
            res.json(savedResult)
        }
        res.json(existingUser)
    }
    res.json({
        message: "not found"
    })
}

export const AddFood = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (user) {
        const { name, description, price, category, foodType, readyTime } = <CreatFoodInput>req.body;

        const vandor = await FindVandor(user._id);

        if (vandor !== null) {

            const files = req.files as [Express.Multer.File];

            const images = files.map((file: Express.Multer.File) => file.filename)


            const createFood = await Food.create({
                vandorId: vandor._id,
                name,
                description,
                category,
                foodType,
                images: images,
                readyTime,
                price,
                rating: 0,
            });

            vandor.foods.push(createFood);
            const result = await vandor.save;
            res.status(201).json({
                message: "record created",
                data: result
            })

        }
    }
    res.json("something went worng with add food")
}

export const GetFood = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (user) {
        const food = await Food.find({ vendorId: user._id });

        if (food !== null) {
            res.json({ food })
        }
    }
    res.json("something went worng with get food")
}

export const GetCurrentOrders = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;
    if (user) {
        const orders = await Order.find({ vendorId: user._id }).populate('items.food');

        if (orders != null) {
            res.status(200).json(orders)
        }
    }
    res.status(400).json({
        message: "Orders not found"
    })
}


export const GetOrderDetails = async (req: Request, res: Response, next: NextFunction) => {

    const orderId = req.params.id;

    if (orderId) {

        const order = await Order.findById(orderId).populate('items.food');

        if (order != null) {
            return res.status(200).json(order);
        }
    }

    return res.json({ message: 'Order Not found' });
}

export const ProcessOrder = async (req: Request, res: Response, next: NextFunction) => {
    const OrderId = req.params.id;

    const {status , remarks, time} = req.body;

    if(OrderId){
        const order = await Order.findById(OrderId).populate('food');

        order.orderStatus= status;
        order.remarks = remarks;
        if(time){
            order.readTime = time
        }

        const orderResult = await order.save();

        if(orderResult != null){
            res.status(200).json(orderResult)
        }
    }

    res.json({
        message : "Unable to process Order"
    })

}

export const AddOffer = async (req: Request, res: Response, next: NextFunction) => {


    const user = req.user;

    if(user){
        const { title, description, offerType, offerAmount, pincode,
        promocode, promoType, startValidity, endValidity, bank, bins, minValue, isActive } = <CreateOfferInputs>req.body;

        const vendor = await FindVandor(user._id);

        if(vendor){

            const offer = await Offer.create({
                title,
                description,
                offerType,
                offerAmount,
                pincode,
                promoType,
                startValidity,
                endValidity,
                bank,
                isActive,
                minValue,
                vendor:[vendor]
            })

            console.log(offer);

            return res.status(200).json(offer);

        }

    }

    return res.json({ message: 'Unable to add Offer!'});

    

}
export const GetOffer = async (req: Request, res: Response, next: NextFunction) => {}