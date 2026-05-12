import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const WAVE_API_KEY = process.env.WAVE_API_KEY;
const WAVE_API_URL = process.env.WAVE_API_URL || 'https://api.wave.com/v1/transactions';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('VOLT Wave Backend is running');
});

app.post('/api/wave', (req, res) => {
  const { items, total, currency } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Le panier est vide.' });
  }

  if (!total || typeof total !== 'number' || total <= 0) {
    return res.status(400).json({ error: 'Montant total invalide.' });
  }

  const WAVE_BUSINESS_URL = 'https://pay.wave.com/m/M_sn_Bg4an4f38jXi/c/sn/';
  
  const description = `Paiement VOLT - ${items.map(i => i.name).join(', ')}`;
  
  const paymentUrl = `${WAVE_BUSINESS_URL}?amount=${total}&currency=${currency}&description=${encodeURIComponent(description)}`;

  return res.json({ 
    success: true, 
    url: paymentUrl,
    items,
    total,
    currency
  });
});

app.listen(port, () => {
  console.log(`VOLT Wave backend listening on http://localhost:${port}`);
});
