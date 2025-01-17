import { IsEmail, IsEmpty, Length } from "class-validator";
import { Types } from "mongoose";


export class CreateCustmerInput {

    @IsEmail()
    email : string;

    @Length(7,14)
    phone : string;

    @Length(6,12)
    password : string;
}
export class UserLoginInput {

    @IsEmail()
    email : string;

    @Length(6,12)
    password : string;
}
export class EditCustomerProfileInputs {

    @Length(6,12)
    firstName : string;
    @Length(6,12)
    lastName : string;

    @Length(6,12)
    address : string;
}
export interface CustomerPayload {
    _id:string;
    email : string;
    verified : boolean
}

export class OrderInput{
    _id : string;

    unit : number;
}

export class CartItem {
    _id: string;
    unit: number;
}