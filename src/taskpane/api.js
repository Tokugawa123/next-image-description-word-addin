// import axios from "axios";
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});
export default async function apiRequest(imageData, apiText) {
  // let sceneX_input = `data:image/png;base64,${imageData}`;
  // console.log("sceneX_input======>", sceneX_input);
  //   console.log("imageData", fileData.imageData, "algorithm", fileData.algorithm, "languages", [fileData.language]);
  // console.log("apiText===>", apiText);
  let openai_input = `data:image/png;base64,${imageData}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: apiText,
          },
          {
            type: "image_url",
            image_url: {
              url: openai_input,
            },
          },
        ],
      },
    ],
    temperature: 0.6,
    max_tokens: 1024,
  });

  //console.log("reponse=====>", response);

  // const response = await axios.request(response);

  // console.log("reponse=====>", response.data);

  return response;
}
