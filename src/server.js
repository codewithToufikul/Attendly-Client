import { createServer } from "http";
import mongoose from "mongoose";
import { envVars } from "./config/env.js";
import app from "./app.js";
import { initSocket } from "./socket.js";
import User from "./models/User.js";

const port = Number(envVars.PORT) || 3000;

let server = null;

const startServer = async () => {
  try {
    try {
      if (envVars.MONGO_URI) {
        await mongoose.connect(`${envVars.MONGO_URI}`);
        console.log("Connected to MongoDB Atlas");
        // Attempt to drop stale unique index on users.studentId if it exists
        try {
          const col = mongoose.connection.db.collection('users');
          const indexes = await col.indexes();
          const hasStale = indexes.find(i => i.name === 'studentId_1');
          if (hasStale) {
            await col.dropIndex('studentId_1');
            console.warn('Dropped stale index users.studentId_1');
          }
        } catch (idxErr) {
          // Ignore if index does not exist or cannot be dropped
        }
      } else {
        console.warn("No MONGO_URI provided; running with mock JSON DB only.");
      }
    } catch (dbErr) {
      console.warn("MongoDB connection failed; continuing with mock JSON DB:", dbErr?.message || dbErr);
    }
    server = createServer(app);
    initSocket(server);
    server.listen(port, () => {
      console.log(`server running on ${port}`);
    });
  } catch (error) {
    console.error(error);
  }
};

startServer();
