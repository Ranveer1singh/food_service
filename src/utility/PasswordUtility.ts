import bcrypt from "bcrypt"
import { Request } from "express"
import { VandorPayload } from "../dto"
import jwt from "jsonwebtoken"
import { platform } from "os"
import { App_secret } from "../config"
import { AuthPayload } from "../dto/Auth.dto"

export const GenerateSalt = async()=>{
    return await bcrypt.genSalt()
}

export const GeneratePassword = async (password : string, salt : string)=>{
    return await bcrypt.hash(password, salt)
}

export const ValidatePassword = async(enteredPassword : string , savedPassword : string, salt : string)=>{
    return await GeneratePassword(enteredPassword, salt) === savedPassword;
    
}


// token generate 
export const GenerateSignature = (payload : AuthPayload)=>{
    const signature = jwt.sign(payload,App_secret,{expiresIn:"1h"})
    return signature;

}

export const ValidateSignature = async (req : Request) => {
    const signature = req.get('Authorization');

    if(signature){
        const payload = await jwt.verify(signature.split(" " )[1], App_secret) as AuthPayload

        req.user = payload;
        return true;
    }
}