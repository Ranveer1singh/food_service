import { Mongo_Uri } from "../config";
import mongoose from "mongoose";

// data base connection
export default async () =>{

    try {
        mongoose.connect(Mongo_Uri).then(result=>{
            console.log("data base connect")
        })
    } catch (error) {
        console.log(error);
        
        
    }
}