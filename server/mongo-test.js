require("dotenv").config();

const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

async function test() {
  try {
    console.log("Testing MongoDB connection...");

    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("✅ MongoDB connection works!");
  } catch (error) {
    console.error("❌ MongoDB test failed:");
    console.error(error);
  } finally {
    await client.close();
  }
}

test();