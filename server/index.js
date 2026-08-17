require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.send('Server is running');
});

async function generateChatReply(messages) {
  const recentMessages = messages.slice(-6); // Limit to the last 6 messages for context

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dots-studio/dots-3-note-preview:free',
      messages: recentMessages,
      max_tokens: 150,
      stream: false,
      reasoning: { enabled: false },
    }),
  });

  const data = await response.json();
  console.log('OpenRouter usage:', data?.usage);

  if (!response.ok) {
    const errorMessage = data?.error?.message || 'OpenRouter request failed';
    throw new Error(errorMessage);
  }

  const reply = data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error('No reply content received from model');
  }

  return reply;
}

async function generateImageDataUrl(prompt) {
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Image generation request failed');
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  return `data:image/png;base64,${imageBuffer.toString('base64')}`;
}

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    const reply = await generateChatReply(messages);
    return res.json({ reply });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/message', async (req, res) => {
  const { messages } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const lastUserMessage = [...messages].reverse().find((message) => message?.role === 'user');

  if (!lastUserMessage || !lastUserMessage.content || !String(lastUserMessage.content).trim()) {
    return res.status(400).json({ error: 'A user message is required' });
  }

  try {
    const classificationResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dots-studio/dots-3-note-preview:free',
        messages: [
          {
            role: 'system',
            content:
              'Classify the user request. Respond with ONLY the single word "image" if the user is asking to generate, create, draw, or make an image or picture. Otherwise respond with ONLY the single word "chat".',
          },
          { role: 'user', content: lastUserMessage.content },
        ],
        max_tokens: 10, // Limit tokens for classification
        stream: false,
        temperature: 0, // Use a low temperature for deterministic classification
        reasoning: { enabled: false },  // Disable reasoning for classification
      }),
    });

    const classificationData = await classificationResponse.json();
    const classification = String(classificationData?.choices?.[0]?.message?.content || '').trim().toLowerCase();

    console.log('Classification result:', classification);

    if (!classificationResponse.ok) {
      const errorMessage = classificationData?.error?.message || 'Classification request failed';
      return res.status(classificationResponse.status).json({ error: errorMessage });
    }

    if (classification === 'image') {
      const image = await generateImageDataUrl(String(lastUserMessage.content).trim());
      return res.json({ type: 'image', image });
    }

    const reply = await generateChatReply(messages);
    return res.json({ type: 'text', reply });
  } catch (error) {
    console.error('Error in /api/message:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/image', async (req, res) => {
  const { prompt } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const image = await generateImageDataUrl(prompt);
    return res.json({ image });
  } catch (error) {
    console.error('Error in /api/image:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
