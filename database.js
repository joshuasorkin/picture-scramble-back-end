import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

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
  imageRef: { type: Schema.Types.ObjectId, ref: 'Image' },
  uploaded: Boolean
});

const imageSchema = new Schema({
  images: [Buffer],
  wordImageRef: { type: String, required: false },
  uploadedIndexes: [],
  wordRef: { type: Schema.Types.ObjectId, ref: 'Word' }
});

const wordTestSchema = new Schema({
  word: String,
  language: String,
  imageRef: { type: Schema.Types.ObjectId, ref: 'ImageTest' },
  uploaded: Boolean
});

const imageTestSchema = new Schema({
  images: [Buffer],
  uploadedIndexes:[],
  wordRef: { type: Schema.Types.ObjectId, ref: 'WordTest' }
});




// Create a model based on the schema
const WordImage = mongoose.model('WordImage', wordImageSchema);
const Word = mongoose.model('Word', wordSchema);
const Image = mongoose.model('Image', imageSchema);
const WordTest = mongoose.model('WordTest', wordTestSchema);
const ImageTest = mongoose.model('ImageTest', imageTestSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function getAllImageTestDocuments() {
    try {
      const documents = await ImageTest.find({});
      console.log("Documents in ImageTest:", documents);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  }
  
  // Call the async function
  getAllImageTestDocuments();