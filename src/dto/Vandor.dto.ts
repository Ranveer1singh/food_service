export interface CreateVandorInput {
    name : string,
    ownerName : string,
    foodType : [string],
    pincode : string,
    address : string,
    phone : string,
    email : string,
    password : string
}
export interface VandorLoginInput {
    email : string,
    password : string
}
export interface VandorPayload {
    email : string,
    _id : string,
    name : string,
    foodType : [string]
}

export interface EditVandorInput {

 address : string,
    phone : string,
    name : string,
    foodType : [string]
}

export interface CreateOfferInputs {
    offerType: string;
    vendors: [any];
    title: string;
    description: string;
    minValue: number;
    offerAmount: number;
    startValidity: Date;
    endValidity: Date;
    promocode: string;
    promoType: string;
    bank: [any];
    bins: [any];
    pincode: string;
    isActive: boolean;
}