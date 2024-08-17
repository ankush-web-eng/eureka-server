import redis, {createClient} from 'redis';
require('dotenv').config();
const redisClient = createClient({
    url: process.env.REDIS_URL!,
});

redisClient.on('error', (err) => {
    console.error('Redis error: ', err);
});

redisClient.connect()
    .then(() => {
        console.log('Connected to Redis');
    })
    .catch((err) => {
        console.error('Failed to connect to Redis:', err);
    });

async function cacheDoctorData(key: string, value: any, expiration: number) {
    try {
        await redisClient.setEx(key, expiration, JSON.stringify(value));
        console.log(`Data cached under key: ${key}`);
    } catch (err) {
        console.error('Failed to cache data:', err);
    }
}

async function getCachedDoctorData(key: string) {
    try {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        return null;
    } catch (err) {
        console.error('Failed to retrieve data from cache:', err);
        return null;
    }
}

export { redisClient, cacheDoctorData, getCachedDoctorData };
