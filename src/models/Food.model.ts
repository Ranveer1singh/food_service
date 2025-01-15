import exp from "constants";
import mongoose from "mongoose";
import Mongoose, {Schema, Document  } from "mongoose";

export interface FoodDoc extends Document {
    vandorId : string;
    name : string;
    description : string;
    category : string;
    foodType : string;
    readyTime : number;
    price : number;
    rating : number;
    images: [string];

}

const FoodSchema = new Schema({
    vandorId : {type :String},
    name : {type :String , required : true},
    description : {type :String, required : true},
    category : {type :String},
    foodType : {type :String, required : true},
    readyTime :{type :Number, required : true},
    price :{type :Number},
    rating : {type :Number},
    images: {type :[String]},
},
{
    timestamps: true,
    toJSON:{
        transform(doc, ret){
            delete ret.__v,
            delete ret.createdAt,
            delete ret.updatedAt
        }
    }
}
)

const Food = mongoose.model<FoodDoc>('Food', FoodSchema);

export {Food}; 