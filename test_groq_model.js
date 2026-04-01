import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function testModel() {
    try {
        console.log("Testing meta-llama/llama-prompt-guard-2-86m model...");

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: "Analyze this: I am a software engineer with 5 years of experience."
                }
            ],
            model: "meta-llama/llama-prompt-guard-2-86m",
            temperature: 0.3,
            max_tokens: 2048,
            response_format: { type: "json_object" }
        });

        console.log("Success! Response:", completion.choices[0]?.message?.content);
    } catch (error) {
        console.error("Error details:", error.message);
        console.error("Full error:", error);

        // Try listing available models
        console.log("\nTrying to list available models...");
        try {
            const models = await groq.models.list();
            console.log("Available models:", models.data.map(m => m.id).join(", "));
        } catch (e) {
            console.error("Could not list models:", e.message);
        }
    }
}

testModel();
