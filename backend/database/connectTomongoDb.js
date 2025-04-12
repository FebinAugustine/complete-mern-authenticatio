import mongoose from "mongoose";

export const connectToMongoDb = async () => {
  try {
    const connectToDb = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Successfully connected to mongoDb`);
    console.log(`Connection Host: ${connectToDb.connection.host}`);
  } catch (error) {
    console.log("MongoDb Connection Error: ", error.message);
    process.exit(1); // 1 is failure, 0 status code is success
  }
};
