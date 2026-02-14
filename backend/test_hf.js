import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

console.log("Starting test...");
const env = dotenv.config();
console.log("Dotenv config result:", env.error ? env.error : "Loaded");
console.log("Token present:", !!process.env.HUGGING_FACE_API_TOKEN);

const client = new InferenceClient(process.env.HUGGING_FACE_API_TOKEN);

async function test() {
    console.log("Calling test function...");
    try {
        console.log("Calling HF API...");
        const chatCompletion = await client.chatCompletion({
            model: "meta-llama/Llama-3.1-8B-Instruct",
            messages: [{ role: "user", content: "Hello" }],
        });
        console.log("Success:", chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error("Failure:", error);
    }
    console.log("Test finished.");
}

test().catch(e => console.error("Unhandled error:", e));
