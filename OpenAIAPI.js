import OpenAI from "openai";

class OpenAIAPI {
  constructor(wordList) {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Your OpenAI API Key
    });
    this.wordList = wordList;
  }

  getRandomWord() {
    const randomIndex = Math.floor(Math.random() * this.wordList.length);
    return wordList[randomIndex];
  }

  async generateWordAndPictureUntilSuccess(wordParam = null,score){
    console.log("starting generation");
    console.log({score});
    let success = false;
    let word;
    let picture;
    while(!success){
      try{
        //word = await this.generateWord(wordParam,score);
        word = getRandomWord();
        console.log({word});
        if (word.length > process.env.WORD_LENGTH_MAX){
          throw "word too long";
        }
        picture = await this.generatePicture(word);
        console.log({picture});
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

  async generateWord(topicParam,score = 0) {
    try {
      console.log("generating word...");
      let prompt;
      if (topicParam){
        prompt = process.env.GENERATE_WORD_PROMPT_TOPIC.replace('{}',topicParam);
      }
      else{
        if(this.chance(score)){
          prompt = process.env.GENERATE_WORD_PROMPT_CONCRETE;
        }
        else{
          prompt = process.env.GENERATE_WORD_PROMPT_ABSTRACT;
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

  async generatePicture(word) {
    try {
      const response = await this.client.images.generate({
        model: "dall-e-3", // Replace with the appropriate model
        prompt:`Generate a picture of ${word}, in a random historical art style.  Do not include the word '${word}' in the picture. Do not include any text in the picture.`,
        n: 1, // Number of images to generate
        size: "1024x1024" // Image size
      });

      let picture = response.data[0].url; // URL of the generated image
      return picture;
    } catch (error) {
      console.error('Error generating picture:', error);
      throw error;
    }
  }

  async generateCompliment(word) {
    try {
      console.log("generating compliment...");
      const prompt = process.env.GENERATE_COMPLIMENT.replace('{}',word);
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
