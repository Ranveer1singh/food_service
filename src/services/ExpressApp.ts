import express, { Application } from "express";
import bodyParser from "body-parser";
import { AdminRoute, CustomerRoute, ShopingRoute, VandorRoute } from "../routes/index";
import path from "path";
// create express application

export default async (app:Application) => {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use('/images',express.static(path.join(__dirname, 'images')));
    
    app.use("/admin", AdminRoute);
    app.use("/vandor", VandorRoute);
    app.use("/customer", CustomerRoute);
    app.use(ShopingRoute)
    return app
}





// app.listen(8000, () => {
//   console.clear();
//   console.log("app start on port 8000");
// });
