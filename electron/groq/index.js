import Groq from "groq-sdk";
import { configDotenv } from "dotenv";

configDotenv();

const groq = new Groq({ apiKey: process.env.GROQ_KEY });

const systemPromptForCommandCompletion = `
You are really really good at guessing the next command that the user will type.
you may be given history of previous run commands and also some portion of command which you have to complete.
using both of them, your task it to give me the command that you think the user is trying to execute.
Remember that the history is just an extra information. The guess may not always be something from the history.
You will only output the command. Nothing more, nothing less. No matter what error you get, do not produce anything else
You will not add any extra information or explanation.

Examples:
history: [cd /somedir, ls -l, npm insall]
current command: "npm i" or "empty"
output: "npm install"
Reason: The last run command had a typo, therefore the user running the same command is highly possible.

history: [pwd, cd Projects/, git clone git@github.com/user/repo.git]
current command: "cd"
output: "cd repo"
Reason: The user is trying to change directory to the cloned repository.

history: []
current command: gr
output: "grep"
Reason: There is no history this time, so just went with the popular command that starts with gr.

history: [cd /somedir, ls -l, npm insall]
current command: "let me se"
output: ""
Reason: The user is just writing something in terminal. if there is no similar command, just ignore and return empty string.
`

export async function getGroqCommandCompletion(histroy, currentCommand) {

    histroy = JSON.stringify(histroy); // convert the history array to a string

    try {
        const response = await groq.chat.completions.create({
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
            model: "llama-3.3-70b-versatile",
        });

        return response.choices[0]?.message?.content; // return the command

    } catch (err) {
        const errorMessage = err?.error?.error?.message || 'Unknown error occurred';
        console.log(errorMessage);
        return null; // return null in case of error
    } 
}

