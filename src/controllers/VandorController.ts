import express, { Response, Request, NextFunction } from "express"
import { CreateOfferInputs, EditVandorInput, VandorLoginInput } from "../dto"
import { FindVandor } from "./AdminController";
import { GenerateSignature, ValidatePassword } from "../utility";
import { CreatFoodInput } from "../dto/Food.dto";
import { Food } from "../models/Food.model";
import { Order } from "../models/Order.model";
import { Offer } from "../models/Offer.model";
import { promises } from "dns";

export const VandorLogin = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
        const { email, password } = req.body as VandorLoginInput;
      
        try {
          // Validate input
          if (!email || !password) {
             res.status(400).json({ message: 'Email and password are required' });
             return ;
          }
      
          // Check if the vendor exists
          const existingVandor = await FindVandor('', email);
      
          if (!existingVandor) {
             res.status(404).json({ message: 'Vendor not found' });
             return;
          }
      
          // Validate password
          const isPasswordValid = await ValidatePassword(password, existingVandor.password, existingVandor.salt);
          if (!isPasswordValid) {
             res.status(400).json({ message: 'Incorrect password' });
             return;
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
           return;
        } catch (error) {
          next(error); // Forward the error to the error handling middleware
          res.status(500).json({
            message : "Internal server Error" + error
          })
        }
}


export const GetVandorProfile = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try {
        const user = req.user;
        console.log("User data" , user);
        

        if (!user) {
             res.status(400).json({ message: "User not found in request" });
             return;
        }

        const existingUser = await FindVandor(user._id);

        if (!existingUser) {
             res.status(404).json({ message: "Vendor profile not found" });
             return ;
        }

         res.status(200).json(existingUser);
         return ;
    } catch (error) {
        console.error("Error fetching vendor profile:", error);
         res.status(500).json({ message: "Internal server error" });
         return;
    }
};


export const UpdateVendorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, foodType, address, phone } = req.body as EditVandorInput; 
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: "Unauthorized: User not found in request" });
            return; 
        }

        const existingUser = await FindVandor(user._id);

        if (!existingUser) {
            res.status(404).json({ message: "Vendor profile not found" });
            return;
        }

        // Update vendor properties
        if (name) existingUser.name = name;
        if (foodType) existingUser.foodType = foodType;
        if (address) existingUser.address = address;
        if (phone) existingUser.phone = phone;

        // Save updated vendor
        const savedResult = await existingUser.save();
        res.status(200).json(savedResult);
        return;
    } catch (error) {
        console.error("Error updating vendor profile:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
        return;
    }
};


export const UpdateVendorCoverImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(400).json({ message: "User not authenticated" });
            return;
        }

        const vendor = await FindVandor(user._id);

        if (!vendor) {
            res.status(404).json({ message: "Vendor not found" });
            return;
        }

        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            res.status(400).json({ message: "No files uploaded" });
            return;
        }

        // Map filenames and push to the vendor's coverImage array
        const images = files.map((file: Express.Multer.File) => file.filename);
        vendor.coverImage.push(...images);

        const result = await vendor.save();

        res.status(201).json({
            message: "Cover images updated successfully",
            data: result,
        });
    } catch (error) {
        console.error("Error updating vendor cover image:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const UpdateVendorService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(400).json({ message: "User not authenticated" });
            return;
        }

        const existingUser = await FindVandor(user._id);

        if (!existingUser) {
            res.status(404).json({ message: "Vendor not found" });
            return;
        }

        // Toggle the serviceAvailable property
        existingUser.serviceAvailable = !existingUser.serviceAvailable;

        const savedResult = await existingUser.save();

        res.status(200).json({
            message: "Vendor service availability updated successfully",
            vendor: savedResult
        });
    } catch (error) {
        console.error("Error updating vendor service availability:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


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