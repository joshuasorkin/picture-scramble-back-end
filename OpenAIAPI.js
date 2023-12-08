import OpenAI from "openai";

class OpenAIAPI {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Your OpenAI API Key
    });
  }

  async generateWordAndPictureUntilSuccess(){
    let success = false;
    let word;
    let picture;
    while(!success){
      try{
        word = await this.generateWord();
        console.log({word});
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

  async generateWord() {
    try {
      console.log("generating word...");
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo", // Or another suitable model
        messages: [
          {role:"user",content:"Generate a random English language word between 4 to 10 characters in length.  Do not surround it with quotation marks. Respond only with the word itself."}
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
        prompt:`Generate a picture of ${word}, photorealistic.`,
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
}

export default OpenAIAPI;
