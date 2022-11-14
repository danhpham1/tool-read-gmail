const { MongoClient } = require('mongodb');

class Mongodb {
    #db
    
    constructor(){
    }

    async connect() {
        const client = new MongoClient(process.env.MONGO_URL);
        await client.connect();
        const db = client.db(process.env.DB_NAME);
        this.#db = db;
        console.log("Connect mongodb success");
    }

    #getCollection(name){
        return this.#db.collection(name);
    }

    findOneAndUpdate(filter, data) {
        return this.#getCollection('shops').findOneAndUpdate(filter, { $set: data })
    }
}

module.exports = {
    Mongodb
}