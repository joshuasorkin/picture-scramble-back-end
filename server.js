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

const scrambleWord = (word) => {
        // Convert the word into an array of characters
        let characters = word.split('');
    
        // Fisher-Yates Shuffle Algorithm
        for (let i = characters.length - 1; i > 0; i--) {
            // Pick a random index before the current one
            let j = Math.floor(Math.random() * (i + 1));
    
            // Swap characters[i] with the character at the random index
            [characters[i], characters[j]] = [characters[j], characters[i]];
        }
    
        // Convert the array of characters back into a string
        return characters.join('');
}
    
  
const findMismatches = (solution, playerSolution) => {
// Implement logic to find mismatches here
};

app.get('/new-game', async (req, res) => {
    try {
      const word = await generateWord();
      const picture = await generatePicture(word);
      const scramble = scrambleWord(word);
  
      const newGame = new Game({ solution: word, scramble, picture });
      await newGame.save();
  
      res.send({ gameId: newGame._id, scramble, picture });
    } catch (error) {
      res.status(500).send('Error creating new game');
    }
});

app.get('/check-answer', async (req, res) => {
    const { playerSolution, gameId } = req.query;
  
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        res.status(404).send('Game not found');
        return;
      }
  
      const checkResult = game.solution === playerSolution;
      let mismatches = [];
      if (!checkResult) {
        mismatches = findMismatches(game.solution, playerSolution);
      }
  
      res.send({ checkResult, mismatches });
    } catch (error) {
      res.status(500).send('Error checking answer');
    }
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
