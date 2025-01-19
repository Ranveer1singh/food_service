import express, { Request, Response, NextFunction } from "express";
import { plainToClass } from "class-transformer";
import {
  CartItem,
  CreateCustmerInput,
  EditCustomerProfileInputs,
  OrderInput,
  UserLoginInput,
} from "../dto/Customer.dto";
import { validate } from "class-validator";
import {
  GenerateOtp,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  onRequestOtp,
  ValidatePassword,
} from "../utility";
import { Customer } from "../models/Customer.model";
import { Food } from "../models/Food.model";
import { Order } from "../models/Order.model";

export const CustomerSignUp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Transform and validate input
    const customerInputs = plainToClass(CreateCustmerInput, req.body);
    const inputErrors = await validate(customerInputs, {
      validationError: { target: false },
    });

    if (inputErrors.length > 0) {
      res.status(400).json({ errors: inputErrors });
      return;
    }

    const { email, phone, password } = customerInputs;
    // Generate secure password and OTP
    const salt = await GenerateSalt();
    const hashedPassword = await GeneratePassword(password, salt);
    const { otp, expiry } = GenerateOtp();

    // Check if the customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      res.status(409).json({ message: "Customer already exists" });
      return;
    }



    // Create new customer
    const newCustomer = await Customer.create({
      email,
      password: hashedPassword,
      phone,
      salt,
      otp,
      otp_expiry: expiry,
      firstName: "",
      lastName: "",
      address: "",
      verified: false,
      lat: 0,
      lng: 0,
      orders: [],
    });

    if (newCustomer) {
      // Send OTP
      await onRequestOtp(otp, phone);

      // Generate a signature for authentication
      const signature = GenerateSignature({
        _id: newCustomer._id.toString(),
        email: newCustomer.email,
        verified: newCustomer.verified,
      });

      // Respond with success
      res.status(201).json({
        signature,
        verified: newCustomer.verified,
        email: newCustomer.email,
      });
      return;
    }
    res.status(500).json({ message: "Failed to create customer" });
    return;

  } catch (error) {
    next(error); // Pass errors to the global error handler
    res.status(500).json({
      message: error.message,
    })
    return
  }
};

export const CustomerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Parse and validate login inputs
    const loginInputs = plainToClass(UserLoginInput, req.body);
    const validationErrors = await validate(loginInputs, {
      validationError: { target: false },
    });

    if (validationErrors.length > 0) {
      res.status(400).json({ errors: validationErrors });
      return;
    }

    const { email, password } = loginInputs;

    // Find customer by email
    const customer = await Customer.findOne({ email });
    if (!customer) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Validate password
    const isPasswordValid = await ValidatePassword(
      password,
      customer.password,
      customer.salt
    );

    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Generate token
    const token = GenerateSignature({
      _id: customer._id.toString(),
      email: customer.email,
      verified: customer.verified,
    });

    // Respond with token and customer info
    res.status(200).json({
      signature: token,
      verified: customer.verified,
      email: customer.email,
    });
  } catch (error) {
    next(error); // Pass error to the error handling middleware
  }
};


export const CustomerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { otp } = req.body;
    const customer = req.user;

    if (!customer) {
      res.status(400).json({ message: "Customer not found" });
      return;
    }

    const profile = await Customer.findById(customer._id);
    if (!profile) {
      res.status(404).json({ message: "Customer profile not found" });
      return;
    }

    // Validate OTP and expiry
    const isOtpValid =
      profile.otp === parseInt(otp, 10) && profile.otp_expiry >= new Date();

    if (!isOtpValid) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    // Mark customer as verified and save the profile
    profile.verified = true;
    profile.otp = undefined; // Optionally clear the OTP
    profile.otp_expiry = undefined; // Optionally clear the OTP expiry
    const updatedCustomer = await profile.save();

    // Generate a new token
    const token = GenerateSignature({
      _id: updatedCustomer._id.toString(),
      email: updatedCustomer.email,
      verified: updatedCustomer.verified,
    });

    // Send response
    res.status(200).json({
      signature: token,
      verified: updatedCustomer.verified,
      email: updatedCustomer.email,
    });
  } catch (error) {
    next(error); // Pass error to the error-handling middleware
  }
};

export const RequestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = req.user;

    if (!customer) {
      res.status(401).json({ message: "Unauthorized: Customer not found." });
      return;
    }

    const profile = await Customer.findById(customer._id);

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found." });
      return;
    }

    const { otp, expiry } = GenerateOtp();

    profile.otp = otp;
    profile.otp_expiry = expiry;

    await profile.save();
    await onRequestOtp(otp, profile.phone);

    res.status(200).json({
      message: "OTP has been sent to your registered phone number.",
    });
  } catch (error) {
    next(error); // Pass the error to the centralized error handler
  }
};

export const GetCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = req.user;

    if (!customer) {
      res.status(401).json({ message: "Unauthorized: Customer not found." });
      return;
    }

    const profile = await Customer.findById(customer._id);

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found." });
      return;
    }

    res.status(200).json(profile);
  } catch (error) {
    next(error); // Pass the error to the centralized error handler
  }
};



export const EditCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = req.user;
    const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);

    const profileError = await validate(profileInputs, {
      validationError: { target: true },
    });

    if (profileError.length > 0) {
      res.status(400).json({
        message: "Validation error in profile inputs.",
        errors: profileError,
      });
      return;
    }

    const { firstName, lastName, address } = profileInputs;

    if (!customer) {
      res.status(401).json({ message: "Unauthorized: Customer not found." });
      return;
    }

    const profile = await Customer.findById(customer._id);

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found." });
      return;
    }

    profile.firstName = firstName;
    profile.lastName = lastName;
    profile.address = address;

    const result = await profile.save();

    res.status(200).json({
      message: "Customer profile updated successfully.",
      result,
    });
  } catch (error) {
    next(error); // Pass the error to the centralized error handler
  }
};


export const CreateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = req.user;

    if (!customer) {
      res.status(401).json({ message: "Unauthorized: Customer not found." });
      return;
    }

    const orderId = `${Math.floor(Math.random() * 89999) + 1000}`;
    const profile = await Customer.findById(customer._id);

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found." });
      return;
    }

    const cart: [OrderInput] = req.body;
    if (!cart || cart.length <= 0) {
      res.status(400).json({ message: "Cart is empty." });
      return;
    }

    let cartItems: any[] = [];
    let netAmount = 0;

    const foodIds = cart.map((item) => item._id);
    const foods = await Food.find().where("_id").in(foodIds).exec();

    if (!foods || foods.length === 0) {
      res.status(404).json({ message: "No food items found." });
      return;
    }

    foods.forEach((food) => {
      const cartItem = cart.find((item) => item._id === food._id.toString());
      if (cartItem) {
        const { unit } = cartItem;
        netAmount += food.price * unit;
        cartItems.push({ food, unit });
      }
    });

    if (cartItems.length === 0) {
      res.status(400).json({ message: "No valid items in cart." });
      return;
    }

    const currentOrder = await Order.create({
      orderId,
      items: cartItems,
      totalAmount: netAmount,
      orderDate: new Date(),
      paidThrough: "COD",
      paymentResponse: "",
      orderStatus: "waiting",
    });

    profile.orders.push(currentOrder);
    await profile.save();

    res.status(201).json({
      message: "Order created successfully.",
      order: currentOrder,
    });
  } catch (error) {
    next(error); // Pass the error to the centralized error handler
  }
};

export const GetOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = req.user;

    if (!customer) {
      res.status(401).json({ message: "Unauthorized: Customer not found." });
      return;
    }

    const profile = await Customer.findById(customer._id).populate("orders");

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found." });
      return;
    }

    if (!profile.orders || profile.orders.length <=0) {
      res.status(404).json({ message: "No orders found for this customer." });
      return;
    }

    res.status(200).json({
      message: "Orders retrieved successfully.",
      orders: profile.orders,
    });
  } catch (error) {
    next(error);
  }
};


export const GetOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      res.status(400).json({ message: "Order ID is required." });
      return;
    }

    const order = await Order.findById(orderId).populate("items.food");

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    res.status(200).json({
      message: "Order retrieved successfully.",
      order,
    });
  } catch (error) {
    next(error);
  }
};



/*--------- Cart Section--------*/
export const AddToCart = async (req: Request, res: Response, next: NextFunction) => {


  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);
    let cartItems = Array();

    const { _id, unit } = <CartItem>req.body;

    const food = await Food.findById(_id);

    if (food) {
      if (profile !== null) {
        cartItems = profile.cart;
        if (cartItems.length > 0) {
          let existfoodItems = cartItems.filter((item) => item.food._id.toString() === _id);
          if (existfoodItems.length > 0) {
            const index = cartItems.indexOf(existfoodItems[0])
            if (unit > 0) {
              cartItems[index] = { food, unit };

            } else {
              cartItems.splice(index, 1)
            }
          } else {
            cartItems.push({ food, unit })
          }
        } else {
          cartItems.push({ food, unit })
        }

        if (cartItems) {
          profile.cart = cartItems as any;
          const cartResult = await profile.save();
          res.status(200).json(cartResult.cart)
        }
      }
    }
  }
}

export const GetCart = async (req: Request, res: Response, next: NextFunction) => {

  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      res.status(200).json(profile.cart);

    }

  }
  res.status(400).json({
    Message: 'cart is empty!'
  })
}

export const DeleteCart = async (req: Request, res: Response, next: NextFunction) => {


  const customer = req.user;

  if (customer) {

    const profile = await Customer.findById(customer._id).populate('cart.food').exec();

    if (profile != null) {
      profile.cart = [] as any;
      const cartResult = await profile.save();

      return res.status(200).json(cartResult);
    }

  }

  return res.status(400).json({ message: 'cart is Already Empty!' })

}