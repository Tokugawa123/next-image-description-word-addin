export async function savePrompt(text) {
  let key = localStorage.length;
  console.log("promptsave", text);
  while (localStorage.getItem(key) !== null) {
    console.log("savekey==>", key, "==", localStorage.getItem(key));
    key++;
  }
  localStorage.setItem(key, text);
  console.log("promptsave", text);
}
export async function loadPrompt() {
  let result = [];

  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    let prompt = localStorage.getItem(key);
    console.log("key===>", key, "prompt==>", prompt);
    result.push({ key: key, value: prompt });
  }
  console.log("result===>", result);
  return result;
}
