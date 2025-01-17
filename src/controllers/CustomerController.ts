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
) => {
  const loginInputs = plainToClass(UserLoginInput, req.body);
  const loginError = await validate(loginInputs, {
    validationError: { target: true },
  });

  if (loginError.length > 0) {
    res.status(400).json(loginError);
  }

  const { email, password } = loginInputs;

  const customer = await Customer.findOne({ email });

  if (customer) {
    const validation = await ValidatePassword(
      password,
      customer.password,
      customer.salt
    );

    if (validation) {
      // generate signature / token
      const signature = GenerateSignature({
        _id: customer._id.toString(),
        email: customer.email,
        verified: customer.verified,
      });

      res.status(200).json({
        signature: signature,
        verified: customer.verified,
        email: customer.email,
      });
    }
  }

  res.status(400).json({
    message: "error in login",
  });
};

export const CustomerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { otp } = req.body;
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      if (profile.otp === parseInt(otp) && profile.otp_expiry >= new Date()) {
        profile.verified = true;
        const updatedCustomerResponse = await profile.save();

        const signature = GenerateSignature({
          _id: updatedCustomerResponse._id.toString(),
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });
        res.status(200).json({
          signature: signature,
          verified: updatedCustomerResponse.verified,
          email: updatedCustomerResponse.verified,
        });
      }
    }
  }
  res.status(400).json({
    message: "customer verifide controller error",
  });
};

export const RequestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      const { otp, expiry } = GenerateOtp();

      profile.otp = otp;
      profile.otp_expiry = expiry;

      await profile.save();
      await onRequestOtp(otp, profile.phone);

      res.status(200).json({
        message: "OTP is sent to your register phone number ",
      });
    }
  }
  res.status(400).json({
    message: "Error while send Otp",
  });
};

export const GetCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      res.status(200).json(profile)
    }
  }
  res.status(400).json({
    message: 'customer profile fetch  controller not working'
  })
};

export const EditCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
  const profileError = await validate(profileInputs, {
    validationError: { target: true },
  });
  if (profileError.length > 0) {
    res.status(400).json({
      message: " error in get customer profile",
      profileError,
    });
  }
  const { firstName, lastName, address } = profileInputs

  if (customer) {
    const profile = await Customer.findById(customer._id);

    if (profile) {
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.address = address;

      const result = await profile.save();
      res.status(200).json({
        result
      })
    }
  }
  res.status(400).json({
    message: 'customer profile update controller not working'
  })
};

export const CreateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;

  if (customer) {
    // Create order ID
    const orderId = `${Math.floor(Math.random() * 89999) + 1000}`;
    const profile = await Customer.findById(customer._id);

    if (!profile) {
      res.status(404).json({ message: "Customer profile not found" });
    }

    let cart = <[OrderInput]>req.body;
    let cartItems = Array();
    let netAmount = 0.0;
    let vendorId;
    // Calculate amount
    const foods = await Food.find()
      .where("_id")
      .in(cart.map((item) => item._id))
      .exec();
    foods.map((food) => {
      cart.map(({ _id, unit }) => {
        if (food._id == _id) {
          vendorId = food.vandorId;
          netAmount += food.price * unit;
          cartItems.push({ food, unit });
        }
      });
    });

    // Create order with description
    if (cartItems.length > 0) {
      const currentOrder = await Order.create({
        orderId: orderId,
        items: cartItems,
        totalAmount: netAmount,
        orderDate: new Date(),
        paidThrough: "COD",
        paymentResponse: "",
        orderStatus: "waiting",
      });

      if (currentOrder) {
        profile.orders.push(currentOrder);
        await profile.save();

        res.status(201).json(currentOrder);
      }
    }
    res.status(400).json({ message: "Cart is empty" });
  }

  res.status(401).json({ message: "Unauthorized" });
};

export const GetOrders = async (req: Request, res: Response, next: NextFunction) => {

  const customer = req.user;

  if (customer) {


    const profile = await Customer.findById(customer._id).populate("orders");
    if (profile) {
      res.status(200).json(profile.orders);
    }

  }

  res.status(400).json({ msg: 'Orders not found' });
}


export const GetOrderById = async (req: Request, res: Response, next: NextFunction) => {

  const orderId = req.params.id;


  if (orderId) {


    const order = await Customer.findById(orderId).populate("items.food");

    if (order) {
      res.status(200).json(order);
    }

  }

  res.status(400).json({ msg: 'Order not found' });
}


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