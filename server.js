import express from 'express';
import mongoose from 'mongoose';
import OpenAIAPI from './OpenAIAPI.js'; // Adjust this import based on your implementation
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import fetch from 'node-fetch';
dotenv.config();

const wordList = fs.readFileSync(process.env.WORDLIST_FILE,'utf8').split('\n');

// Define a schema for the word_images collection
const wordImageSchema = new mongoose.Schema({
  word: String,
  images: [Buffer] // Array of images stored as Buffers
},{
  strict:false,
  collection:'word_image'
});

// Create a model based on the schema
const WordImage = mongoose.model('WordImage', wordImageSchema);

async function storeImage(word, url) {
  try {
    console.log("storeImage url:",url);
     // Use fetch to download the image
     const response = await fetch(url);
     if (!response.ok) {
       throw new Error(`Failed to fetch image: ${response.statusText}`);
     }
     const arrayBuffer = await response.arrayBuffer();
     const imageBuffer = Buffer.from(arrayBuffer);
 
     let wordDoc = await WordImage.findOne({ word: word });
 
     if (wordDoc) {
       wordDoc.images.push(imageBuffer);
       await wordDoc.save();
     } else {
       wordDoc = new WordImage({ word: word, images: [imageBuffer] });
       await wordDoc.save();
     }
     console.log("image saved")
   } catch (err) {
     console.error('Error:', err);
     throw err;
   }
}

const findExistingPicture = async (word) => {
  try {
    const wordDoc = await WordImage.findOne({ word: word });

    if (!wordDoc || wordDoc.images.length === 0) {
      return null; // No matching document or no images found
    }

    return process.env.BASE_URL+`/image/${word}`
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}


const wordGeneratedToday = async (word) => {
  const twentyFourHoursAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));

  const recentGames = await Game.find({
      solution: word,
      date_create: {
          $gte: twentyFourHoursAgo
      }
  });
  console.log({recentGames},"length:",recentGames.length);
  const result = recentGames.length > 0;
  console.log({result});
  return result;
}

const OpenAIAPI_obj = new OpenAIAPI(wordList,wordGeneratedToday,findExistingPicture,storeImage);
const app = express();
app.use(express.json());

app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define the Game model
const gameSchema = new mongoose.Schema({
  solution: String,
  scramble: String,
  picture: String,
  date_create: Date,
  date_solve: Date,
  topic: String,
  compliment: String
});
const Game = mongoose.model('Game', gameSchema);

const scramblePhrase = (phrase) => {
  const phraseArray = phrase.split(' ');
  for(let x=0;x<phraseArray.length;x++){
    phraseArray[x] = scrambleWord(phraseArray[x]);
  }
  return phraseArray.join(' ');
}

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
    const mismatches = [];
    const minLength = Math.min(solution.length, playerSolution.length);

    for (let i = 0; i < minLength; i++) {
        if (solution[i] !== playerSolution[i]) {
            mismatches.push(i);
        }
    }

    // If playerSolution is longer than solution, mark the extra characters as mismatches
    for (let i = minLength; i < playerSolution.length; i++) {
        mismatches.push(i);
    }

    return mismatches;
};




app.get('/new-game', async (req, res) => {
    try {
      console.log("starting new game...");
      const topicParam = req.query.topic;
      const languageParam = req.query.language;
      console.log({topicParam});
      const scoreParam = req.query.score ? req.query.score : 0;
      console.log({scoreParam});
      let wordAndPicture;
      if (topicParam !== undefined){
        wordAndPicture = await OpenAIAPI_obj.generateWordAndPictureUntilSuccess(topicParam)
      }
      else{ 
        wordAndPicture = await OpenAIAPI_obj.generateWordAndPictureUntilSuccess(null,scoreParam);
      }
      console.log({wordAndPicture});
      const word = wordAndPicture.word;
      const picture = wordAndPicture.picture;
      const compliment = await OpenAIAPI_obj.generateCompliment(word);
      const scramble = scramblePhrase(word);
      const newGame = new Game({ 
        solution: word, 
        scramble: scramble, 
        picture: picture,
        compliment: compliment,
        date_create: new Date()
      });
      const saveResult = await newGame.save();
      console.log("date create:",newGame.date_create);
  
      res.send({ gameId: newGame._id, scramble, picture });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error creating new game');
    }
});

app.get('/check-game', async (req, res) => {
    const { gameId, playerSolution } = req.query;
    console.log({playerSolution});
    try {
      const game = await Game.findById(gameId);
      console.log({game});
      if (!game) {
        res.status(404).send('Game not found');
        return;
      }
      const checkResult = game.solution === playerSolution;
      let mismatches = [];
      let updatedGame;
      // Update the game document with date_solve
      if (checkResult){
        updatedGame = await Game.findByIdAndUpdate(gameId, { date_solve: new Date() },{new: true});
        console.log("date_solve:",updatedGame.date_solve)
      }
      else {
        mismatches = findMismatches(game.solution, playerSolution);
      }
      console.log({checkResult});
      console.log({mismatches});
      res.send({ 
        checkResult:checkResult,
        compliment:game.compliment
      });
    } catch (error) {
      res.status(500).send('Error checking answer');
    }
});

app.get('/image/:word', async (req, res) => {
  try {
      const word = req.params.word;
      const wordDoc = await WordImage.findOne({ word: word });

      if (wordDoc && wordDoc.images.length > 0) {
          const imageBuffer = wordDoc.images[0]; // Get the first image

          res.setHeader('Content-Type', 'image/png');
          res.send(imageBuffer);
      } else {
          res.status(404).send('No images found for the specified word');
      }
  } catch (err) {
      console.error('Error:', err);
      res.status(500).send('Internal Server Error');
  }
});



//retrieve the document for a game with a given ID
app.get('/game/:id',async(req,res) => {

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
