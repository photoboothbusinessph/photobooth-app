import "server-only";
import { MongoClient, type Db } from "mongodb";
import { getServerEnvironment } from "@/lib/server/env";

declare global {
  var photoboothMongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDatabase(): Promise<Db> {
  const { MONGODB_DB } = getServerEnvironment();
  const client = await getMongoClient();
  return client.db(MONGODB_DB);
}

export async function getMongoClient(): Promise<MongoClient> {
  const { MONGODB_URI } = getServerEnvironment();
  if (!global.photoboothMongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    global.photoboothMongoClientPromise = client.connect();
  }
  return global.photoboothMongoClientPromise;
}
