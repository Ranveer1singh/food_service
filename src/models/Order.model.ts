import mongoose from "mongoose";
import Mongoose, {Schema, Document  } from "mongoose";

export interface OrderDoc extends Document {
    orderId : string, 
    vendorId : string,
    items : [any], //[{food, unit}]
    totalAmount : number,
    orderDate  : Date,
    paidThrough : string,
    paymentResponse : string,
    orderStatus : string,
    remarks : string,
    deliveryId : string,
    readTime, number

}

const OrderSchema = new Schema({
    orderId : {type : String, required : true},
    vendorId: {type: String, require: true},
    items : [{
        food  : {type : Schema.Types.ObjectId,ref: "Food", required : true},
        unit :  {type : String, required : true}
    }], //[{food, unit}]
    totalAmount : {type : Number, required : true},
    orderDate  : {type : Date},
    paidThrough : {type : String}, 
    paymentResponse : {type : String},
    orderStatus : {type : String},
    remarks: {type: String},
    deliveryId: {type: String},
    readyTime:{type: Number},
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

const Order = mongoose.model<OrderDoc>('Order', OrderSchema);

export {Order}; 