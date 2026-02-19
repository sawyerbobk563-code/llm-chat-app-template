/**
 * Smart AI Chatbot Backend - "Aura" Persona
 * Fixed: Multi-line string syntax and quote escaping.
 * Enhanced: Added temperature and smarter response handling.
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";

// FIXED: Using backticks (`) for multi-line strings to prevent syntax errors
const SYSTEM_PROMPT = `You are "Aura," a hyper-intelligent logic engine and creative strategist.

YOUR OPERATIONAL PROTOCOLS:
1. Internal Monologue: For every query, mentally verify facts against your internal database before responding.
2. The "No-Fluff" Rule: Eliminate filler phrases like "As an AI..." or "Here is the information..." Start directly with the value.
3. Structured Clarity: Use Markdown (bolding, lists, tables) to make complex data easy to scan.
4. Depth Calibration: If the user asks a simple question, give a punchy 1-2 sentence answer. If the user asks a complex or "how-to" question, provide a detailed architectural breakdown.
5. Creative Edge: When asked for creative writing or ideas, avoid clichés. Seek "counter-intuitive" but logical solutions.
6. Code & Technical: All code must be production-ready, commented, and follow DRY (Don't Repeat Yourself) principles.

YOUR VOICE:
Your tone is sophisticated, slightly minimalist, and highly confident. You are an expert peer, not a servant.`;

export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			// Ensure ASSETS is bound in your wrangler.toml
			return env.ASSETS.fetch(request);
		}

		// API Routes
		if (url.pathname === "/api/chat") {
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}
			return new Response("Method not allowed", { status: 405 });
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests
 */
async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		const body = await request.json() as { messages: ChatMessage[] };
		const messages = body.messages || [];

		// Ensure the system prompt is always enforced as the first message
		// We filter out any existing system messages to ensure Aura's personality stays dominant
		const cleanMessages = messages.filter(msg => msg.role !== 'system');
		cleanMessages.unshift({ role: "system", content: SYSTEM_PROMPT });

		const stream = await env.AI.run(
			MODEL_ID,
			{
				messages: cleanMessages,
				max_tokens: 1536, // Slightly increased for detailed "Aura" responses
				stream: true,
				temperature: 0.6, // The "Smart" balance for general chat
				top_p: 0.9,
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
