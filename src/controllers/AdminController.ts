import {Response, Request, NextFunction} from "express"
import { CreateVandorInput } from "../dto"
import { Vandor } from '../models'
import { create } from "domain";
import { GeneratePassword, GenerateSalt } from "../utility";
export const FindVandor = async (id:string | undefined, email? : string ) => {
    if(email){
        return await Vandor.findOne({email : email})
    }else{
        return await Vandor.findById(id)
    }
}


export const CreateVandor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, ownerName, foodType, pincode, address, phone, email, password } = req.body;

        const existingVandor = await FindVandor("", email);
        if (existingVandor != null) {
              res.json({ message: "vandor already exists" });
           
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
    } catch (error) {
        console.log(error); // Forward errors to the error handler
    }
};
export const GetVandor =  async (req : Request, res : Response, next: NextFunction)=>{
    const vandors = await Vandor.find();

    if(vandors != null) {
        res.json(vandors)
    }
    res.json({
        message : "Not found "
    })
}
export const GetVandorById =  async (req : Request, res : Response, next: NextFunction)=>{

    const vandorId = req.params.id;

    const vandor = await FindVandor(vandorId);

    if(vandor != null){
        res.json(vandor)
    }

    res.json({
        Message : "not found"
    })
}