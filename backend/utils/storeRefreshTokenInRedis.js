import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const client = new Redis(process.env.UPSTASH_REDIS_URL);

export const storeRefreshTokenInRedis = async (userId, refreshToken) => {
  await client.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  ); // 7days
};

export const deleteRefreshTokenInRedis = async (userId) => {
  try {
    const deletedCount = await client.del(`refresh_token:${userId}`);
    return deletedCount > 0; // Returns true if token was deleted
  } catch (error) {
    console.error("Error deleting refresh token:", error);
    return false;
  }
  // await client.del(`refresh_token:${userId}`);
};

export const getStoredTokenFromRedis = async (userId) => {
  try {
    const storedToken = await client.get(`refresh_token:${userId}`);
    return storedToken; // Returns the token string or null if not found
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};
