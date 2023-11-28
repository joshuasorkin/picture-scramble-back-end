
//todo: decouple db operations from mongo by separating operations into a 
//DatabaseController class that gets extended as a DatabaseController_Mongo class,
//as suggested by chatGPT here: https://chat.openai.com/share/f0a4417b-481a-462a-8662-5d23434e11e0

//todo: there are a bunch of call-related CRUD here, should those instead be operations in a Call
//class and call generic getValue,insertRecord,setValue,updateRecord operations from that class?
//maybe getValue and setValue shouldn't be dependent on callSid

import { MongoClient } from 'mongodb';

class Database{

    async initialize(dbName = process.env.MONGO_DATABASE_NAME){
        try {
            this.client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
            await this.client.connect();
            this.database = this.client.db(dbName);
            console.log("Database connected");
        }
        catch (error){
            console.error("Error in initialize:",error);
            throw error;
        }
    }

    //todo: this will cause an error if the collection does not exist,
    //need to check for collection existence before calling drop()
    async resetCollection(collectionName){
        const database = this.database;
        const collections = await this.database.listCollections().toArray();
        console.log({collections});
        const collectionExists = collections.some(collection => collection.name === collectionName);
        
        if (collectionExists) {
            await database.collection(collectionName).drop();
            console.log(`Collection '${collectionName}' dropped successfully.`);
        } else {
            console.log(`Collection '${collectionName}' does not exist.`);
        }
    }


    async getDocument(collectionName,query){
        try{
            const result = await this.database.collection(collectionName).findOne(query);
            return result;
        }
        catch(error){
            console.error(error);
            return null;
        }
    }

    
    async getOrCreateDocument(collectionName,query,data){
        const result = await this.getDocument(collectionName,query);
        if(result && result !== undefined){
            return result;
        }
        else{
            await this.createDocument(collectionName,data);
            return await this.getDocument(collectionName,query);
        }
    }

    //todo: result should be the actual document, not just the result
    //of insertOne() so we don't have to call getDocument()
    async createDocument(collectionName,data){
        try{
            const result = await this.database.collection(collectionName).insertOne(data);
            return result;
        }
        catch(error){
            throw error;
        }
    }

    async pushToDocumentArray(collectionName,key_document,value_document,key_update,value_update){
        //filter for selecting the document
        const filter = {};
        filter[key_document] = value_document;
        //update query for pushing value to array
        const update = { $push: {}};
        update.$push[key_update] = value_update;
        const result = await this.database.collection(collectionName).updateOne(filter,update);
        return result;
    }

    async updateArray(collectionName,key_document,value_document,key_array,index,newValue){
        const filter = {};
        filter[key_document] = value_document;
        const updateObj = {};
        updateObj[key_array+'.'+index] = newValue;
        const result = await this.database.collection(collectionName).updateOne(
            filter,
            {$set: updateObj});
    }

    async getValue(callSid,key){
        const call = await this.getCall(callSid);
        if (call && call[key]===undefined){
            return null;
        }
        else{
            return call[key];
        }
    }

    async setValue(collectionName,key_document, value_document, key, value) {
        const filter = {};
        filter[key_document] = value_document;
        const update = { $set: {} }; // Initialize an empty update object
        // Dynamically set the key in the update object based on the 'key' parameter
        update.$set[key] = value;      
        const result = await this.database.collection(collectionName).updateOne(filter, update);
        return result;
    }

    async getCollectionAsDictionary(collectionName,key_document){
        const collection = this.database.collection(collectionName);
        const cursor = await collection.find();
        const documentDictionary = {};
        while (await cursor.hasNext()) {
            const document = await cursor.next();
            const key_dictionary = document[key_document];
            documentDictionary[key_dictionary] = document;
        }
        return documentDictionary;
    }
}

export default Database;