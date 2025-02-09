import {Response, Request, NextFunction} from "express"
import { CreateVandorInput } from "../dto"
import { Vandor } from '../models'
import { GeneratePassword, GenerateSalt } from "../utility";


export const FindVandor = async (id:string | undefined, email? : string ) => {
    if(email){
        return await Vandor.findOne({email : email})
    }else{
        return await Vandor.findById(id)
    }
}

// Create 
export const CreateVandor = async (req: Request, res: Response, next: NextFunction) : Promise<void>=> {
    try {
        const { name, ownerName, foodType, pincode, address, phone, email, password } = req.body;

        const existingVandor = await FindVandor("", email);
        if (existingVandor != null) {
              res.json({ message: "vandor already exists" });
              return;
           
        }

        const salt = await GenerateSalt();
        const userPassword = await GeneratePassword(password, salt);

        const createVandor = await Vandor.create({
            name,
            ownerName,
            foodType,
            pincode,
            address,
            phone,
            email,
            password: userPassword,
            salt,
            serviceAvailable: false,
            coverImage: [],
            rating: 0,
            foods : [],
        });

        res.json(createVandor); // Respond with the newly created vendor
        return ;
    } catch (error) {
        console.log(error); // Forward errors to the error handler
        res.status(500).json({
            message : "Internal server error" + error
        })
    }
};
// login
export const GetVandor = async (req: Request, res: Response, next: NextFunction) : Promise<void>=> {
    try {
        const vandors = await Vandor.find();

        if (vandors && vandors.length > 0) {
              res.status(200).json(vandors); //   200 status with the data
              return;
        }

        // If no vandors are found
          res.status(404).json({
            message: "No vandors found",
        });
        return ;
    } catch (error) {
        // Handle any unexpected errors
        console.error("Error fetching vandors:", error);
          res.status(500).json({
            message: "An error occurred while fetching vandors",
            error: error.message || "Internal Server Error",
        });
        return ;
    }
};
//vandor get id
export const GetVandorById =  async (req : Request, res : Response, next: NextFunction) : Promise<void>=>{

    const vandorId = req.params.id;

  try {
    // Validate if ID is provided
    if (!vandorId) {
       res.status(400).json({ message: 'Vendor ID is required' });
       return ;
    }

    // Call the service or database query to find the vendor
    const vandor = await FindVandor(vandorId);

    // Check if the vendor was found
    if (vandor) {
       res.status(200).json({
        message :  "Record found",
        data : vandor});
       return ;
    }

    // Vendor not found
     res.status(404).json({ message: 'Vendor not found' });
     return ;
  } catch (error) {
    // Handle unexpected errors
    next(error);
    res.status(500).json({
        message : "Internal server error" + error
    })
    return ;
  }
}

