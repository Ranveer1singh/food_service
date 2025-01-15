import dotenv from 'dotenv'
dotenv.config();
// Email



// Notification
// otp
export const GenerateOtp= () => {
    const otp = Math.floor(100000 + Math.random() * 90000);
    let expiry = new Date();

    expiry.setTime(new Date().getTime() + (30 * 60 *1000))

    return {otp, expiry}
}

export const onRequestOtp = async (otp:number,toPhoneNumber : string)=>{

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_ACCOUNT_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    const response = await client.messages.create({
        body : `Your Otp Is ${otp}`,
        from : "+91 8889332916",
        to : `+91${toPhoneNumber}`
    })

    return response;

}
// PFAGCTDQA2D2A5XRTSMUSSXB

// payament notification and email