exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "You are a JSON API. You must ALWAYS respond with valid JSON only. Never write explanations, greetings, or any text outside the JSON object. If you cannot help, still return JSON with an error key."
          },
          ...body.messages
        ],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let text = data.choices?.[0]?.message?.content || "";

    // Strip any markdown fences if model adds them
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Validate it's JSON before sending
    JSON.parse(text);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ text }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
