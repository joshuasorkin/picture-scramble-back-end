import OpenAI from "openai";

class OpenAIAPI {
  //todo: need a better solution than just adding arguments to pass in more functions
  constructor(wordList,OpenAI_utilities) {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Your OpenAI API Key
    });
    this.wordList = wordList;
    this.OpenAI_utilities = OpenAI_utilities;   
  }

  getRandomWord() {
    const randomIndex = Math.floor(Math.random() * this.wordList.length);
    return this.wordList[randomIndex];
  }

  async generateWordAndPictureUntilSuccess(wordParam = null,score,language){
    console.log("starting generation");
    console.log({score});
    let success = false;
    let alreadyShownToday = false;
    let generateAttempts = 0;
    let word;
    let picture;
    while(!success){
      try{
        if(alreadyShownToday && generateAttempts > 3){
          word = this.getRandomWord();
        }
        //start by searching word_image for an existing word in this language
        word = await this.OpenAI_utilities.getRandomWordByLanguage(language);
        //if there are no words in this language, we need to generate one
        if(!word){
          word = await this.generateWord(wordParam,score,language);
        }
        console.log({word});
        alreadyShownToday = await this.OpenAI_utilities.wordGeneratedToday(word);
        console.log({alreadyShownToday});
        if (alreadyShownToday){
          generateAttempts++;
          throw "already shown today";
        }
        if (word.length > process.env.WORD_LENGTH_MAX){
          throw "word too long";
        }
        picture = await this.generatePicture(word,language);
        success = true;
      }
      catch(error){
        console.error("Error generating word and picture:",error);
        console.log("word+picture generation failed, trying again...");
      }
    }
    const result = {
      word:word,
      picture:picture
    }
    return result;
  }

  //give user a chance at getting an easy game, lower chance as score increases
  chance(num) {
    //give user a minimum number of games that are automatically easy
    if (num < process.env.EASY_GAMES_COUNT){
      return true;
    }
    num = parseInt(num);
    // Generate a random integer between 0 and num (inclusive)
    const result = Math.floor(Math.random() * (num + 1));
    console.log("chance:",{num},"result:",{result})
    // Check if the result is equal to num and return the boolean value
    return result >= (num / 2);
  }

  async generateWord(topicParam,score = 0,language) {
    try {
      console.log("generating word...");
      let prompt;
      if (topicParam){
        prompt = process.env.GENERATE_WORD_PROMPT_TOPIC.replace('topic',topicParam).replace('language',language);
      }
      else{
        if(this.chance(score)){
          prompt = process.env.GENERATE_WORD_PROMPT_CONCRETE.replace('language',language);
        }
        else{
          prompt = process.env.GENERATE_WORD_PROMPT_ABSTRACT.replace('language',language);
        }
      }
      console.log({prompt});
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo", // Or another suitable model
        messages: [
          {role:"user",content:prompt}
        ],
        max_tokens: 10,
      });
      console.log({response});
      let word = response.choices[0].message.content.toLowerCase().trim();
      // Additional logic to ensure the word meets your criteria
      console.log("generateWord:",{word});
      return word;
    } catch (error) {
      console.error('Error generating word:', error);
      throw error;
    }
  }

  async generatePicture(word,language) {
    try {
      const existingPicture = await this.OpenAI_utilities.findExistingPicture(word);
      console.log({existingPicture});
      if (existingPicture){
        console.log("found existing picture:",existingPicture);
        try{
          //generate another picture so we add more variety to this word_image
          //but do it async so user doesn't have to wait for extra image to be generated
          let picture = this.generateAndStorePicture(word,language);
          console.log("Successfully generated extra picture");
        }
        catch(err){
          console.error('Error generating extra picture:',err)
        }
        return existingPicture;
      }
      let picture = await this.generateAndStorePicture(word,language);
      return picture;
    } catch (error) {
      console.error('Error generating picture:', error);
      throw error;
    }
  }

  async generateAndStorePicture(word,language){
    const response = await this.client.images.generate({
      model: "dall-e-3", // Replace with the appropriate model
      prompt:`Generate a picture of ${word}, in a random historical art style.  Do not include the word '${word}' in the picture. Do not include any text in the picture.`,
      n: 1, // Number of images to generate
      size: "1024x1024" // Image size
    });

    let picture = response.data[0].url; // URL of the generated image
    console.log("storing image...");
    this.OpenAI_utilities.storeImage(word,picture,language);
    return picture;
  }

  async generateCompliment(word,language) {
    try {
      console.log("generating compliment...");
      let prompt = process.env.GENERATE_COMPLIMENT.replaceAll("'word'",word).replace('language',language);
      if(language !== "English"){
        prompt += " Do not include an English translation.";
      }
      console.log({prompt});
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo", // Or another suitable model
        messages: [
          {role:"user",content:prompt}
        ],
        max_tokens: 10,
      });
      console.log({response});
      let compliment = response.choices[0].message.content;
      // Additional logic to ensure the word meets your criteria
      console.log("generateCompliment:",{compliment});
      return compliment;
    } catch (error) {
      console.error('Error generating compliment:', error);
      throw error;
    }
  }
}



export default OpenAIAPI;
