"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
var uri = process.env.MONGODB_URI;
var options = {};
var client;
var clientPromise;
if (!uri) {
    throw new Error('Please add your Mongo URI to .env.local');
}
if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the client is not recreated on every hot reload
    if (!global._mongoClientPromise) {
        client = new mongodb_1.MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
}
else {
    // In production mode, it's best to not use a global variable.
    client = new mongodb_1.MongoClient(uri, options);
    clientPromise = client.connect();
}
exports.default = clientPromise;
