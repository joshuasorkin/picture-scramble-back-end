import OpenAI from "openai";

class OpenAIAPI {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Your OpenAI API Key
    });
  }

  async generateWord() {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo", // Or another suitable model
        prompt: "Generate a random English language word between 4 to 10 characters in length.",
        max_tokens: 10,
      });

      let word = response.choices[0].text.trim();
      // Additional logic to ensure the word meets your criteria
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
        prompt: `Generate a picture of ${word}.`,
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
