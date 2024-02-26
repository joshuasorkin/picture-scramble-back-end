import express from 'express';
import mongoose from 'mongoose';
import OpenAIAPI from './OpenAIAPI.js'; // Adjust this import based on your implementation
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const logFilePath = path.join(__dirname, 'migration.log');

// Function to append log messages to the log file
function appendToLogFile(message) {
  fs.appendFileSync(logFilePath, message + '\n', 'utf8');
}

const originalConsoleLog = console.log;
console.log = function(message) {
  originalConsoleLog(message);
  appendToLogFile(new Date().toISOString() + ': ' + message);
};


/*
const wordImageSchema = new mongoose.Schema({
    word: String,
    language: String,
    wordImageDataRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WordImageData'
    }
  },{
    strict: false,
    collection: 'word_image'
  });

const wordImageDataSchema = new mongoose.Schema({
wordImageRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WordImage'
},
images: [Buffer]
}, {
collection: 'word_image_data'
});

// Create a model based on the schema
const WordImage = mongoose.model('WordImage', wordImageSchema);
const WordImageData = mongoose.model('WordImageData', wordImageDataSchema);

async function migrateImageData() {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    console.log("retrieving wordImage documents...")

    // Fetch only the _id fields of all documents
    const wordImageIds = await WordImage.find({}).select('_id');
    console.log(`Total documents to process: ${wordImageIds.length}`);
    console.log("iterating and logging wordImage documents...");
    let processedCount = 0;
    //for (const wordImageIdObj of wordImageIds) {
    const wordImageIdObj = wordImageIds[0];
        const wordImageId = wordImageIdObj._id;
      
        // Fetch the full WordImage document by ID
        console.log(`finding WordImage document with ID: ${wordImageId}`);
        const wordImage = await WordImage.findById(wordImageId);
        if(!wordImage){
            throw new Error(`Unable to find WordImage document with ID: ${wordImageId}`); 
        }       
        console.log(`wordImage id:`,wordImage._id);
        console.log('creating new wordImageData document...');
        const wordImageData = new WordImageData({
          wordImageRef: wordImage._id,
          images: wordImage.images
        });
      
        console.log('saving new wordImageData document...');
        // Save the new WordImageData document
        await wordImageData.save();
      
        console.log('verifying wordImage/wordImageData buffer arrays match...');
        // Verification Step
        console.log('finding newly created wordImageData...');
        const savedImageData = await WordImageData.findById(wordImageData._id);
        if (!savedImageData || !buffersEqual(savedImageData.images, wordImage.images)) {
            throw new Error(`Data verification failed for WordImage ID: ${wordImage._id}`);
        }
      
        // Remove the images field from the original wordImage document
        //wordImage.images = undefined;
        wordImage.wordImageDataRef = wordImageData._id;
        await wordImage.save();
      
        console.log(`Migrated and verified images for wordImage ID: ${wordImage._id}`);
        
        processedCount++;
        console.log(`Processed ${processedCount}/${wordImageIds.length} documents (WordImage ID: ${wordImageId})`);
    //}
  
    console.log('Migration completed.');
  }
  
  function buffersEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      // Convert MongoDB Binary to Node.js Buffer if necessary
      const buffer1 = arr1[i]._bsontype === 'Binary' ? Buffer.from(arr1[i].buffer) : arr1[i];
      const buffer2 = arr2[i]._bsontype === 'Binary' ? Buffer.from(arr2[i].buffer) : arr2[i];
  
      if (!Buffer.isBuffer(buffer1) || !Buffer.isBuffer(buffer2)) {
        throw new Error('One of the array elements is not a buffer');
      }
      if (!buffer1.equals(buffer2)) return false;
    }
    return true;
  }



  // Execute the migration function
  migrateImageData()
    .then(() => {
      console.log('All data migrated successfully');
      process.exit(0); // Exit the script successfully
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1); // Exit the script with error
    });

    */

    // Schema for the new word collection
const wordSchema = new mongoose.Schema({
  word: String
}, {
  collection: 'word'
});

// Model for interacting with the new word collection
const Word = mongoose.model('Word', wordSchema);

// Function to copy word values to the new collection
async function copyWords() {
  try {
    // Find all documents in the word_images collection
    const wordImages = await WordImage.find({}).select('word -_id');

    // Transform the data to match the schema of the new collection
    const wordsToInsert = wordImages.map(doc => ({ word: doc.word }));

    // Insert the transformed data into the new word collection
    await Word.insertMany(wordsToInsert);

    console.log('Words copied successfully.');
  } catch (error) {
    console.error('Error copying words:', error);
  }
}

// Call the function to start the copy process
copyWords();