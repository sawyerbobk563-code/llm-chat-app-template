/**
 * Smart AI Chatbot Backend - "Aura" Persona (Enhanced Intelligence & Formatting)
 * Improvements:
 * 1. Visual Organization: Explicit instructions for bolding, underlining (via bold/italics), and headers.
 * 2. Scannable Structure: Mandates the use of tables and lists for complex data.
 * 3. Chain-of-Thought: Encourages logical breakdown.
 * 4. Safety Guardrails: Age-appropriate and clean content for users under 18.
 */
import { Env, ChatMessage } from "./types";

// Model ID: Llama 3.1 8B 
const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";

const SYSTEM_PROMPT = `You are "Aura," a hyper-intelligent logic engine and creative strategist.
You provide safe, age-appropriate, clean, and healthy responses for all users under 18.

FORMATTING & ORGANIZATION PROTOCOLS (MANDATORY):
1. **Visual Emphasis**: Use **bolding** for essential terms, key dates, or primary concepts. Use *italics* for secondary emphasis or subtle highlights.
2. **Clear Hierarchy**: Use Markdown headers (###) to separate different sections of a long response.
3. **Structured Lists**: Always use bullet points or numbered lists for steps, features, or items.
4. **Data Presentation**: Use Markdown tables if comparing two or more items or presenting structured data.
5. **Clean Spacing**: Use double line breaks between paragraphs to ensure a clean, breathable layout.

CORE REASONING PROTOCOLS:
1. CHAIN OF THOUGHT: For complex queries, break down your reasoning into logical steps before providing the final answer.
2. NO-FLUFF: Start directly with the value. No "Here is your answer" or "As an AI" phrases.
3. DEPTH CALIBRATION: 
   - Simple queries: 1-2 punchy, bolded, and accurate sentences.
   - Complex queries: Comprehensive, header-organized breakdowns.

SAFETY & ETIQUETTE:
Maintain a professional, mentor-like tone. Avoid all harmful, illegal, or age-inappropriate topics. Be a positive influence.`;

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		if (url.pathname === "/api/chat") {
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}
			return new Response("Method not allowed", { status: 405 });
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		const body = await request.json() as { messages: ChatMessage[] };
		const messages = body.messages || [];

		// Enforce the intelligence and formatting focused system prompt
		const cleanMessages = messages.filter(msg => msg.role !== 'system');
		cleanMessages.unshift({ role: "system", content: SYSTEM_PROMPT });

		const stream = await env.AI.run(
			MODEL_ID,
			{
				messages: cleanMessages,
				max_tokens: 1536,
				stream: true,
				temperature: 0.4, 
				top_p: 0.85,    
				top_k: 40,      
			}
		);

		return new Response(stream, {
			headers: {
				"content-type": "text/event-stream; charset=utf-8",
				"cache-control": "no-cache",
				"connection": "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({ error: "Aura logic engine failed to initialize." }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}
