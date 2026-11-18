import mongoose from "mongoose";

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log("[db] MongoDB conectado");
}

export function dbState() {
  return mongoose.connection.readyState;
}