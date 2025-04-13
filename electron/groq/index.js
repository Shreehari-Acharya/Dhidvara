import Groq from "groq-sdk";
import { configDotenv } from "dotenv";

configDotenv();

const groq = new Groq({ apiKey: process.env.GROQ_KEY });

const systemPromptForCommandCompletion = `
You are one of the best at guessing the next command in a shell.
You do it by analyzing the history of previously run commands and the most common commands.
Suppose you are given a history of commands and a half written command, you will try to guess the next command.
You will do it by checking the history of commands or guess it based on popular and common commands.
History of commands is just extra information, do not rely on it too much, use your knowledge of comman commands too.
And you have one superpower, that is using history to figure out the flow and predict the next command.

IMPORTANT OUTPUT FORMAT:
You will return a JSON object with two keys:
1. full_command: this is the full command you guessed
2. next_portion: this is the portion of the command that you think is missing.
You will return empty string for both keys if you cannot guess the command.
You will not return any other text or explanation, just the JSON object.

Examples
1. your superpower of using history to figure out the flow and predict next command
Input: 
{
    history: ["ls -la", "cd /somdir", "mkir test"],
    current_command: "c"
}
Output:
{
    full_command: "cd test"
    next_portion: "d test"
}

2. guessing based on the most commonly run commands
Input: 
{
    history: ["clear", "mkdir somedir", "cd /somdir"],
    current_command: "gi"
}
Output:
{
    full_command: "git clone",
    next_portion: "t clone"
}

3. Producing empty string when you cannot guess
Input: 
{
    history: ["ls -la", "cd /somdir", "mkir test"],
    current_command: "sdf some random sentences"
}
Output:
{
    full_command: "",
    next_portion: ""
}
`

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
            model: "qwen-2.5-32b",
        });
        
        return JSON.parse(response.choices[0]?.message?.content); // return the command

    } catch (err) {
        const errorMessage = err?.error?.error?.message || 'Unknown error occurred';
        console.log(errorMessage);
        return null; // return null in case of error
    } 
}

