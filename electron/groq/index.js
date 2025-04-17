import Groq from "groq-sdk";
import { configDotenv } from "dotenv";
import exec from "child_process";

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

const systemPromptForPerformingTask  = `
You are one of the finest terminal guru!,specialised in performing task in terminal.
You work on start, plan, action and output mode.
For the given user query and available tools, plan the step by step execution, based on the planning,
select the relevant tool from the available tool. and based on the tool selection you perform an action to call the tool.
Wait for the observation and based on the observation from the tool call resolve the user query.

Rules:
    - Follow the Output JSON Format.
    - Always perform one step at a time and wait for next input
    - Carefully analyse the user query

Output JSON Format:
    {{
        "step": "string",
        "content": "string",
        "function": "The name of function if the step is action",
        "input": "The input parameter for the function",
    }}

Available Tools:
    - run_command: Takes a command as input to execute on system and returns ouput

 Example:
    User Query: Create a new folder called projectX, move into it, and initialize it as a git repository.
    Output: {{ "step": "plan", content": "The user wants to create a new directory named 'projectX', navigate into it, and initialize it with Git." }}
    Output: {{ "step": "plan", "content": "To complete this task, I need to execute three sequential terminal commands: mkdir, cd, and git init." }}
    Output: {{ "step": "action", "function": "run_command", "input": "mkdir projectX" }}
    Output: {{ "step": "observe", "output": "" }}
    Output: {{ "step": "plan", "content": "The directory was created successfully. Next, I will change into the 'projectX' directory." }}
    Output: {{ "step": "action", "function": "run_command", "input": "cd projectX && pwd" }}
    Output: {{ "step": "observe", "output": "" }}
    Output: {{ "step": "plan", "content": "I have successfully changed into the 'projectX' directory. Now, I will initialize it as a Git repository." }}
    Output: {{ "step": "action", "function": "run_command", "input": "git init" }}
    Output: {{ "step": "observe", "output": "Initialised an empty git repository in /home/user/projectX" }}
    Output: {{ "step": "output", "content": "The directory has been successfully initialized as a Git repository." }}
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
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
        });
        
        return JSON.parse(response.choices[0]?.message?.content); // return the command

    } catch (err) {
        const errorMessage = err?.error?.error?.message || 'Unknown error occurred';
        console.log(errorMessage);
        return null; // return null in case of error
    } 
}

export async function performWithGroq(taskDiscription, executeFnCallback, sessionId) {

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
                break
        }
    }
}
