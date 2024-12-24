const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const openaiApiKey = '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';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer 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`,
};

app.post('/api/chat', async (req, res) => {
  try {
    const input = req.body.text;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{role: 'user', content: `${input}`}],
      },
      { headers }
    );

    const chatGptResponse = response.choices[0].message.content;

    console.log(chatGptResponse);
    res.status(200).json({ message: chatGptResponse });
  } catch (err) {
    console.log('Error: ' + err);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});