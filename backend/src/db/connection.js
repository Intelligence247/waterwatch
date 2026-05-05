import mongoose from "mongoose";

export async function connectDatabase(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
