import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ipCache = new Map();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 Minutes in milliseconds

// Comprehensive regular expression to detect emojis and graphic symbol subsets
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}]/u;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
  const now = Date.now();

  // Enforce the 5-minute cooldown timer check
  if (ipCache.has(ip)) {
    const lastTime = ipCache.get(ip);
    if (now - lastTime < COOLDOWN_MS) {
      const minutesRemaining = Math.ceil((COOLDOWN_MS - (now - lastTime)) / 1000 / 60);
      return res.status(429).json({ 
        error: `Please wait ${minutesRemaining} minute(s) before posting another mod.` 
      });
    }
  }

  const { title, creator, description, code_content } = req.body;

  if (!title || !creator || !description || !code_content) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Anti-Emoji Validation Guard for the Creator Name field
  if (emojiRegex.test(creator)) {
    return res.status(400).json({ 
      error: 'Emojis and special icons are not allowed in the Creator Name field to maintain community safety.' 
    });
  }

  try {
    const { data, error } = await supabase
      .from('workshop_codes')
      .insert([{ title, creator, description, code_content }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    ipCache.set(ip, now);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
