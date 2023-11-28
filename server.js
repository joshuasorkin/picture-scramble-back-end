import express from 'express';
import mongoose from 'mongoose';
import { generateWord, generatePicture } from './OpenAIAPI.js'; // Adjust this import based on your implementation
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define the Game model
const gameSchema = new mongoose.Schema({
  solution: String,
  scramble: String,
  picture: String
});
const Game = mongoose.model('Game', gameSchema);

const port = process.env.PORT | 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
