import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, creator, description, code_content } = req.body;

  if (!title || !creator || !description || !code_content) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (title.length > 100 || creator.length > 50 || description.length > 500) {
    return res.status(400).json({ error: 'Character limit exceeded.' });
  }

  try {
    const { data, error } = await supabase
      .from('workshop_codes')
      .insert([{ title, creator, description, code_content }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
