export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-password');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // Password check
  const password = req.headers['x-access-password'] || '';
  if (password !== process.env.ACCESS_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'missing prompt' });

  // Ping check (for password validation from login screen)
  if (prompt === 'ping') return res.status(200).json({ content: 'pong' });

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content });

  } catch (err) {
    return res.status(500).json({ error: 'groq_error', detail: err.message });
  }
}
