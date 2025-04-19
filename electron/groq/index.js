import Groq from "groq-sdk";
import { configDotenv } from "dotenv";
import { systemPromptForCommandCompletion, systemPromptForPerformingTask } from "./systemPrompts.js";
import { getApiKey } from "../config/settings.js";

function sanitizeForTerminal(text) {
    return text
      .replace(/\r?\n/g, '\r\n')        // Normalize line endings for xterm
      .replace(/[ \t]+/g, ' ')          // Replace multiple spaces/tabs with one space
      .replace(/\r\n(\r\n)+/g, '\r\n')  // Collapse multiple blank lines
      .trim();                          // Remove leading/trailing whitespace
  }

configDotenv();
const apiKey = getApiKey();

if (!apiKey) {
    console.error("API key is not defined");
}
const groq = new Groq({ apiKey: apiKey });


export async function getGroqCommandCompletion(histroy, currentCommand) {

    histroy = JSON.stringify(histroy); // convert the history array to a string

    try {
        const response = await groq.chat.completions.create({
            response_format: {
                "type": "json_object"
            },
            messages: [
                {
                    role: "system",
                    content: systemPromptForCommandCompletion,
                },
                {
                    role: "user",
                    content: `{
                        history: "${histroy}",
                        current_command: "${currentCommand}"
                    }`,
                },
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
        });
        
        return JSON.parse(response.choices[0]?.message?.content); // return the command

    } catch (err) {
        const errorMessage = err?.error?.error?.message || 'Unknown error occurred';
        console.log(errorMessage);
        return null; // return null in case of error
    } 
}

export async function performWithGroq(taskDiscription, executeFnCallback, sessionId, mainWindow) {

    let messages = [
        {
            role: "system",
            content: systemPromptForPerformingTask,
        },
        {
            role: "user",
            content: taskDiscription,
        },
    ]

    let parsedResponse = null;

    while (true) {
        const response = await groq.chat.completions.create({
            
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: messages,
            response_format: {
                "type": "json_object"
            },
        });

        parsedResponse = JSON.parse(response.choices[0]?.message?.content);
        messages.push({
            role: "assistant",
            content: response.choices[0]?.message?.content,
        });

        if(parsedResponse.step === "action") {
            const functionName = parsedResponse.function;
            const input = parsedResponse.input;

            // Execute the function and get the response
            try {
                if(!sessionId){
                    throw new Error("Session ID is not defined");
                }
                const functionResponse = await executeFnCallback(sessionId, input);
                // fs.appendFileSync(`./funRes.txt`,  functionResponse + '\n');
                messages.push({
                    role: "user",
                    content: JSON.stringify({
                        step: "observe",
                        output: functionResponse,
                    }),
                });

            } catch (error) {
                console.log(`Error executing function ${functionName}:`, error);
            }
        }
        else if(parsedResponse.step === "output") {
                console.log(`Output: ${parsedResponse.content}`);
                const cleanedOutput = sanitizeForTerminal(parsedResponse.content);
                mainWindow.webContents.send('terminal-output', {
                    sessionId: sessionId,
                    data: cleanedOutput,
                });
                // write the whole message to a file
                // fs.appendFileSync(`./logs.txt`,  messages.map(m => m.content).join('\n') + '\n');
                break
        }
    }
}
