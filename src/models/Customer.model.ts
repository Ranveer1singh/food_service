import mongoose, { Schema } from "mongoose"
import { Order, OrderDoc } from "./Order.model";

interface CustomerDoc extends Document {
    // name : string,
    email:string,
    password : string,
    salt : string,
    firstName : string,
    lastName : string,
    address : string,
    phone : string,
    verified : boolean,
    otp : number,
    otp_expiry : Date,
    lat : number,
    lng : number,
    orders : [OrderDoc],
    cart: [any],
}

const CustomerSchema  = new Schema({
    email : {type : String, required : true},
    password : {type : String, required : true},
    salt : {type : String, required : true},
    firstName : {type : String},
    lastName : {type : String},
    address : {type : String},
    phone : {type : String, required : true},
    verified : {type : String, required : true},
    otp : {type : String, required : true},
    otp_expiry : {type : String, required : true},
    lat : {type : String},
    lng : {type : String},
    orders :[{
        type : Schema.Types.ObjectId,
        ref : "Order"
    }],
    cart : [
        {
            food : {
                type : Schema.Types.ObjectId,
                ref:"Food"
            },
            unit:{type : Number, required: true}
        }
    ]
   
},
{
    toJSON : {
        transform(doc,ret){
            delete ret.password,
            delete ret.salt,
            delete ret.__v,
            delete ret.createdAt,
            delete ret.updatedAt
        }
    },
    timestamps : true
}
);

const Customer = mongoose.model<CustomerDoc>("Customer", CustomerSchema);
export {Customer}