"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.cacheDoctorData = cacheDoctorData;
exports.getCachedDoctorData = getCachedDoctorData;
const redis_1 = require("redis");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
});
exports.redisClient = redisClient;
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
function cacheDoctorData(key, value, expiration) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield redisClient.setEx(key, expiration, JSON.stringify(value));
            console.log(`Data cached under key: ${key}`);
        }
        catch (err) {
            console.error('Failed to cache data:', err);
        }
    });
}
function getCachedDoctorData(key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cachedData = yield redisClient.get(key);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
            return null;
        }
        catch (err) {
            console.error('Failed to retrieve data from cache:', err);
            return null;
        }
    });
}
