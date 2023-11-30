/* eslint-disable no-undef */
/*
 *Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global document, Office, Word */
import apiRequest from "./api.js";
import { savePrompt, loadPrompt } from "./database.js";

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    // Assign event handlers and other initialization logic.
    document.getElementById("insert-paragraph").onclick = () => tryCatch(insertParagraph);
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";

    //Load function when clicked Add Prompt button
    document.getElementById("save-button").onclick = () => tryCatch(databaseSave);
    document.getElementById("clear-list").onclick = () => tryCatch(clearPromptList);
    //Load prompt when start
    databaseLoad();

    //Function when use prompt from list
    document.getElementById("use-prompt").onchange = () => tryCatch(hideButton);
    document.getElementById("prompt-list").onchange = () => tryCatch(hideButton);
  }
});

let apiText;
async function insertParagraph() {
  // TODO1: Queue commands to insert a paragraph into the document.
  await Word.run(async function (context) {
    const docBody = context.document.body;
    apiText = getData();
    if (document.getElementById("describe-image").value === "describe-selected") {
      let range = await context.document.getSelection();
      let images = range.inlinePictures;
      images.load("id");
      //Syncronizatoin is need in Word for savind data at ch step.
      await context.sync();
      //Get the first inline picture that is selected and convert it to base64
      let picture = range.inlinePictures.getFirstOrNullObject();
      let picbase64 = picture.getBase64ImageSrc();
      await context.sync();
      // eslint-disable-next-line office-addins/load-object-before-read
      let imageBase64 = picbase64.m_value;

      //Confirm base64 image and test inserting text at start position
      // docBody.insertParagraph("Here is base64 code", Word.InsertLocation.start);
      // console.log(imageBase64);
      //Send API request to server by call apiRequest function in api.js And insert response text.
      apiText = getData();
      let showData = await apiRequest(imageBase64, apiText);
      // let showData = apiText;
      console.log("showdata========>", showData);
      // docBody.insertParagraph(showData.result[0].text, Word.InsertLocation.start);
      // docBody.insertParagraph(showData.result[0].i18n.pt, Word.InsertLocation.start);showData.choices[0].message.content

      picture.insertParagraph(showData.choices[0].message.content, "After");

      // newParagraph.insertLocation.replace("New Text");
      //docBody.insertParagraph(showData.choices[0].message.content, Word.InsertLocation.end);
      await context.sync();
      if (images.items.length > 0) {
        let image = images.items[0];
        // let imageId = image.id;
        docBody.insertParagraph(`image_R: ${image.__R}`, Word.InsertLocation.start);
      }
    }
    if (document.getElementById("describe-image").value === "describe-all") {
      // let range = await context.document.getNextOrNullObject();
      //let showData = apiText;
      // Create a proxy object for the first inline picture.
      let firstPicture;
      firstPicture = await context.document.body.inlinePictures.getFirstOrNullObject();
      await context.sync();
      // console.log("firstPicture", firstPicture);
      let picbase64 = firstPicture.getBase64ImageSrc();
      await context.sync();
      // eslint-disable-next-line office-addins/load-object-before-read
      let imageBase64 = picbase64.m_value;
      console.log("imageBase64========>", imageBase64);
      let showData = await apiRequest(imageBase64, apiText);
      console.log("showdata========>", showData);

      // Queue a command to load the alternative text title of the picture.
      //firstPicture.load("altTextTitle");
      firstPicture.insertParagraph(showData.choices[0].message.content, "After");
      // Synchronize the document state by executing the queued commands,
      // and return a promise to indicate task completion.
      await context.sync();
      while (firstPicture.isNullObject === false) {
        firstPicture = firstPicture.getNextOrNullObject();
        // console.log("nextPicture========>", firstPicture);
        picbase64 = firstPicture.getBase64ImageSrc();
        await context.sync();
        imageBase64 = picbase64.m_value;
        console.log("imageBase64========>", imageBase64);
        showData = await apiRequest(imageBase64, apiText);

        // console.log("Inline Picture Started");
        firstPicture.insertParagraph(showData.choices[0].message.content, "After");
        await context.sync();
      }
    }
    //This is just test part for confirm that addin recognize the image
  });
}
/** Default helper for invoking an action and handling errors. */
async function tryCatch(callback) {
  try {
    await callback();
  } catch (error) {
    // Note: In a production add-in, you'd want to notify the user through your add-in's UI.
    // console.error(error);
  }
}

function getData() {
  let result;
  //Read Data from every selected data
  let promptText = document.getElementById("prompt-text").value;
  result = promptText;
  // let describeImage = document.getElementById("describe-image").value;
  // const promptList = document.createElement("option");
  // promptList.textContent = "Describe for other prompt";
  // promptList.id = "001";
  // document.getElementById("describe-image").appendChild(promptList);
  //let descriptionPosition = document.getElementById("description-position").value;

  let bookType = document.getElementById("book-type").value;
  if (bookType !== "no") result = result + " In the aspect of " + bookType + ".";
  let clientAge = document.getElementById("client-age").value;
  if (clientAge === "0-6") result = result + " with very simple and little words.";
  if (clientAge === "7-12") result = result + " with simple words.";
  if (clientAge === "13-17") result = result + " with middle-level words.";
  if (clientAge === "high-level") result = result + " with senior words.";
  let language = document.getElementById("language").value;
  result = result + " In " + language;

  //return all edited sentence.
  return result;
}

async function databaseSave() {
  // localStorage.clear();
  await Word.run(async function () {
    //const docBody = context.document.body;
    savePrompt(document.getElementById("prompt-text").value);
  });
  databaseLoad();
}

async function databaseLoad() {
  await Word.run(async function () {
    //const docBody = context.document.body;
    let arrayPrompts = await loadPrompt();
    document.getElementById("prompt-list").innerHTML = "";
    for (let i = 0; i < arrayPrompts.length; i++) {
      // console.log("promptlength===>", arrayPrompts[i]);
      const promptList = document.createElement("option");
      promptList.textContent = arrayPrompts[i].value; //arrayPrompts[i];
      promptList.value = arrayPrompts[i].key;
      document.getElementById("prompt-list").appendChild(promptList);
    }
  });
}

function clearPromptList() {
  localStorage.clear();
  document.getElementById("prompt-list").innerHTML = "";
}

function hideButton() {
  let usePrompt = document.getElementById("use-prompt").value;
  if (usePrompt === "use-list") {
    document.getElementById("save-button").hidden = true;
    let selectElement = document.getElementById("prompt-list");
    let selectedOptionText = selectElement.options[selectElement.selectedIndex].text;
    document.getElementById("prompt-text").value = selectedOptionText;
  }
  if (usePrompt === "use-entered") {
    document.getElementById("save-button").hidden = false;
  }
}
