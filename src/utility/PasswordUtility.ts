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

export const ValidateSignature = async (req: Request): Promise<boolean> => {
    try {
        const signature = req.get("Authorization"); // Get the Authorization header
        // console.log("Authorization header:", signature)

        if (!signature) {
            console.error("Authorization header is missing");
            return false;
        }

        const token = signature.split(" ")[1]; // Extract the token
        if (!token) {
            console.error("Token is missing in Authorization header");
            return false;
        }

        const payload = await jwt.verify(token, App_secret) as AuthPayload; // Verify the token
        req.user = payload; // Attach the payload to the request object

        return true;
    } catch (error) {
        console.error("Error verifying token:", error.message);
        return false;
    }
};