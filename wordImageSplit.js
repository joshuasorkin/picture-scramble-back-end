import express from 'express';
import mongoose from 'mongoose';
import OpenAIAPI from './OpenAIAPI.js'; // Adjust this import based on your implementation
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
const Schema = mongoose.Schema;


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

const wordImageSchema = new mongoose.Schema({
    word: String,
    language: String
  },{
    strict: false,
    collection: 'word_image'
  });


const wordSchema = new Schema({
  word: String,
  language: String,
  imageRef: { type: Schema.Types.ObjectId, ref: 'Image' }
});

const imageSchema = new Schema({
  images: [Buffer],
  wordRef: { type: Schema.Types.ObjectId, ref: 'Word' }
});

const Word = mongoose.model('Word', wordSchema);
const Image = mongoose.model('Image', imageSchema);
const WordImage = mongoose.model('WordImage', wordImageSchema);
// Assuming you already have a model for word_image

async function migrateData() {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const wordImages = await WordImage.find(); // Assuming WordImage is your model for the original collection
  
    for (let wi of wordImages) {
      const newImage = new Image({ images: wi.images });
      await newImage.save();
  
      const newWord = new Word({ word: wi.word, language: wi.language, imageRef: newImage._id });
      await newWord.save();
  
      newImage.wordRef = newWord._id;
      await newImage.save();
    }
  }
  
  migrateData().then(() => console.log('Migration completed.')).catch(err => console.error(err));
  