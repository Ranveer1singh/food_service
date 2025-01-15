import express from 'express'
import App from "./services/ExpressApp"
import databaseConnection from "./services/Database"

const StartServer = async()=>{

  const app = express();
  await databaseConnection()

  await App(app);

  app.listen(8000, ()=>{
    console.log("server start at port 8000");
    
  });

}

StartServer();