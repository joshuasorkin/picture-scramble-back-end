import express from 'express';
import mongoose from 'mongoose';
import OpenAIAPI from './OpenAIAPI.js'; // Adjust this import based on your implementation
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import fetch from 'node-fetch';
import multer from 'multer';
import sharp from 'sharp';
dotenv.config();

// Configure Multer with a file size limit and memory storage
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 16 * 1024 * 1024 } // 16 MB limit
});

const wordList = fs.readFileSync(process.env.WORDLIST_FILE,'utf8').split('\n');
const Schema = mongoose.Schema;

// Define a schema for the word_images collection
const wordImageSchema = new Schema({
  word: String,
  images: [Buffer] // Array of images stored as Buffers
},{
  strict:false,
  collection:'word_image'
});

const wordSchema = new Schema({
  word: String,
  wordImageRef: { type: String, required: false },
  language: String,
  imageRef: { type: Schema.Types.ObjectId, ref: 'Image' }
});

const imageSchema = new Schema({
  images: [Buffer],
  wordImageRef: { type: String, required: false },
  wordRef: { type: Schema.Types.ObjectId, ref: 'Word' }
});

const wordTestSchema = new Schema({
  word: String,
  language: String,
  imageRef: { type: Schema.Types.ObjectId, ref: 'ImageTest' }
});

const imageTestSchema = new Schema({
  images: [Buffer],
  wordRef: { type: Schema.Types.ObjectId, ref: 'WordTest' }
});




// Create a model based on the schema
const WordImage = mongoose.model('WordImage', wordImageSchema);
const Word = mongoose.model('Word', wordSchema);
const Image = mongoose.model('Image', imageSchema);
const WordTest = mongoose.model('WordTest', wordTestSchema);
const ImageTest = mongoose.model('ImageTest', imageTestSchema);

const getRandomWordByLanguage = async (language) => {
  console.log("looking for random word in",language);
  try {
    // Using the aggregation framework to randomly sample documents
    const randomWordDoc = await Word.aggregate([
      { $match: { language: language } },
      { $sample: { size: 1 } }
    ]);
    if (randomWordDoc.length > 0) {
      const randomWord = randomWordDoc[0].word;
      console.log(`Random word selected for language: ${language}: ${randomWord}`);
      return randomWord;
    } else {
      console.log("No images found for the specified language");
      return null;
    }
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

async function storeImage(word, url = null, language, buffer = null) {
  try {
    console.log("storeImage url:",url);
    let imageBuffer = null;
     // Use fetch to download the image
     if (url){
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
     }
     else if(buffer){
      imageBuffer = buffer;
     }
     else{
      throw new Error(`No image URL or buffer provided for '${word}'.`);
     }
 
     // Find or create the Word document
    let wordDoc = await WordTest.findOne({ word: word, language: language });

    let imageDoc = null;

    if (!wordDoc || !wordDoc.imageRef) {
      // If the word doesn't exist, create a new document
      // Note: Initially, we don't set the imageRef here because it will be set after creating the Image document
      wordDoc = new Word({ word: word, language: language });
      wordDoc.save();
    }
    else{
        imageDoc = await Image.findById(wordDoc.imageRef);
    }

    if (!imageDoc) {
      console.log("no imagedoc found, creating new");
      // If there's no existing Image document, create a new one
      imageDoc = new Image({
        images: [imageBuffer], // Storing the image buffer here
        wordRef: wordDoc._id, // Linking the new Image document to the Word document
      });
    } else {
      console.log("pushing to existing imagedoc");
      // If an existing Image document was found, update it (for simplicity, adding to the array)
      imageDoc.images.push(imageBuffer);
    }

    await imageDoc.save();

    // Ensure the Word document references this Image document
    wordDoc.imageRef = imageDoc._id;
    await wordDoc.save();
     console.log("image stored");
     return true;
   } catch (err) {
     console.error('Error:', err);
     return false;
   }
}

const findExistingPicture = async (word) => {
  try {
    const wordDoc = await Word.findOne({ word: word });

    if (!wordDoc || !wordDoc.imageRef) {
      console.log("No existing image found");
      return null; // No matching document or no images found
    }
    console.log("Existing image found");
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

const OpenAI_utilities = {
  wordGeneratedToday,
  findExistingPicture,
  storeImage,
  getRandomWordByLanguage
}

const OpenAIAPI_obj = new OpenAIAPI(wordList,OpenAI_utilities);
const app = express();
app.use(express.json());

app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define the Game model
const gameSchema = new mongoose.Schema({
  language: String,
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
      let languageParam = req.query.language;
      if (languageParam === undefined){
        languageParam = process.env.DEFAULT_LANGUAGE;
      }
      console.log({topicParam});
      const scoreParam = req.query.score ? req.query.score : 0;
      console.log({scoreParam});
      let wordAndPicture;
      if (topicParam !== undefined){
        wordAndPicture = await OpenAIAPI_obj.generateWordAndPictureUntilSuccess(topicParam)
      }
      else{ 
        wordAndPicture = await OpenAIAPI_obj.generateWordAndPictureUntilSuccess(null,scoreParam,languageParam);
      }
      console.log({wordAndPicture});
      const word = wordAndPicture.word;
      const picture = wordAndPicture.picture;
      const compliment = await OpenAIAPI_obj.generateCompliment(word,languageParam);
      const scramble = scramblePhrase(word);
      const newGame = new Game({
        language: languageParam, 
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
        compliment:game.compliment,
        mismatches:mismatches
      });
    } catch (error) {
      res.status(500).send('Error checking answer');
    }
});

app.get('/image/:word', async (req, res) => {
  try {
      console.log("retrieving image from server...");
      const word = req.params.word;
      const wordDoc = await Word.findOne({ word: word });
      if (wordDoc && wordDoc.imageRef) {
          const imageDoc = await Image.findById(wordDoc.imageRef);
          console.log("image count:",imageDoc.images.length);
          // Generate a random index
          const randomIndex = Math.floor(Math.random() * imageDoc.images.length);
          console.log("random image index",randomIndex);
          // Get the image at the random index
          const imageBuffer = imageDoc.images[randomIndex];
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

app.post('/upload', upload.single('image'), async (req, res) => {
  try{
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    const word = req.body.word;
    let language;
    if(!req.body.language){
      language = process.env.DEFAULT_LANGUAGE;
    }
    else{
      language = req.body.language;
    }

    const buffer = await sharp(req.file.buffer).png().toBuffer();
    if (buffer.length > 16 * 1024 * 1024) {
      throw new Error("Buffer exceeds the MongoDB document size limit.");
      // Handle the error: perhaps by compressing the image further, splitting it, or using GridFS.
    }
    const result = await storeImage(word,null,language,buffer);
    if (result) {
      res.status(201).send({ message: "image stored" });
    }
    else{
      res.status(201).send({ message: "error storing image"});
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing the image.');
  }
});


//retrieve the document for a game with a given ID
app.get('/game/:id',async(req,res) => {

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
