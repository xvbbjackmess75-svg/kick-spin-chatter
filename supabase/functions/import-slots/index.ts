import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SlotData {
  name: string;
  provider: string;
  theme?: string;
  rtp?: number;
  max_multiplier?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting slot data import from aboutslots.com');

    // Fetch the aboutslots.com page
    const response = await fetch('https://www.aboutslots.com/all-casino-slots');
    const html = await response.text();

    console.log('Fetched HTML content, length:', html.length);

    // Parse slot data from HTML
    const slots: SlotData[] = [];
    
    // Extract slot information using regex patterns
    // Look for patterns that contain slot names and providers
    const slotMatches = html.matchAll(/"casino-slots\/([^"]+)"/g);
    const uniqueSlots = new Set<string>();

    for (const match of slotMatches) {
      const urlSlug = match[1];
      if (urlSlug && !uniqueSlots.has(urlSlug)) {
        uniqueSlots.add(urlSlug);
        
        // Convert URL slug to readable name
        const name = urlSlug
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
          .replace(/And/g, '&');

        // Try to extract provider from the surrounding context
        let provider = 'Unknown';
        
        // Look for provider names commonly found on the site
        const providers = [
          'Pragmatic Play', 'NetEnt', 'Play\'n GO', 'Microgaming', 'Evolution',
          'Red Tiger', 'Push Gaming', 'Big Time Gaming', 'Blueprint Gaming',
          'Yggdrasil', 'Quickspin', 'Nolimit City', 'Relax Gaming', 'Hacksaw Gaming',
          'Print Studios', 'Elk Studios', 'Thunderkick', 'IGT', 'WMS', 'Bally',
          'Scientific Games', 'Aristocrat', 'Novomatic', 'Merkur', 'Gamomat',
          'Iron Dog Studio', 'Fantasma Games', 'Northern Lights Gaming',
          'Skywind Group', 'Spinomenal', 'Booming Games', 'Endorphina',
          'BGaming', 'Wazdan', 'Playson', 'Tom Horn Gaming', 'Kalamba Games',
          'Octoplay'
        ];

        // Try to extract provider from page context around the slot
        const slotIndex = html.indexOf(urlSlug);
        const contextBefore = html.substring(Math.max(0, slotIndex - 1000), slotIndex);
        const contextAfter = html.substring(slotIndex, slotIndex + 1000);
        const context = contextBefore + contextAfter;

        for (const providerName of providers) {
          if (context.toLowerCase().includes(providerName.toLowerCase())) {
            provider = providerName;
            break;
          }
        }

        slots.push({
          name,
          provider,
          theme: extractTheme(name),
        });
      }
    }

    console.log(`Extracted ${slots.length} unique slots`);

    if (slots.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No slots found to import' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get existing slots to avoid duplicates
    const { data: existingSlots } = await supabase
      .from('slots')
      .select('name, provider');

    const existingSlotKeys = new Set(
      (existingSlots || []).map(slot => `${slot.name.toLowerCase()}-${slot.provider.toLowerCase()}`)
    );

    // Filter out duplicates
    const newSlots = slots.filter(slot => 
      !existingSlotKeys.has(`${slot.name.toLowerCase()}-${slot.provider.toLowerCase()}`)
    );

    console.log(`Found ${newSlots.length} new slots to insert`);

    if (newSlots.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No new slots to import - all slots already exist',
          total_processed: slots.length 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert new slots in batches to avoid timeouts
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < newSlots.length; i += batchSize) {
      const batch = newSlots.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('slots')
        .insert(batch.map(slot => ({
          ...slot,
          is_user_added: false,
          added_by_user_id: null
        })));

      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }

      insertedCount += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, total inserted: ${insertedCount}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedCount} new slots`,
        total_processed: slots.length,
        new_slots_added: insertedCount,
        existing_slots_skipped: slots.length - insertedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in import-slots function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to import slots', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function extractTheme(name: string): string | undefined {
  const themes = {
    'Egyptian': ['book', 'pharaoh', 'pyramid', 'cleopatra', 'anubis', 'osiris', 'egypt'],
    'Adventure': ['quest', 'treasure', 'explorer', 'adventure', 'jungle', 'tomb'],
    'Mythology': ['gods', 'olympus', 'thor', 'loki', 'mythology', 'divine', 'legendary'],
    'Animals': ['wolf', 'bear', 'lion', 'tiger', 'dog', 'cat', 'wild', 'safari'],
    'Fantasy': ['magic', 'wizard', 'dragon', 'fairy', 'enchanted', 'mystical'],
    'Fruit': ['fruit', 'cherry', 'lemon', 'orange', 'grape', 'watermelon'],
    'Classic': ['777', 'lucky', 'diamond', 'gold', 'classic', 'retro'],
    'Ocean': ['ocean', 'sea', 'shark', 'fish', 'underwater', 'marine'],
    'Space': ['star', 'cosmic', 'galaxy', 'space', 'planet', 'nebula'],
    'Music': ['rock', 'music', 'band', 'concert', 'disco'],
    'Horror': ['vampire', 'ghost', 'halloween', 'scary', 'dark'],
    'Western': ['cowboy', 'sheriff', 'western', 'saloon', 'outlaw'],
    'Asian': ['dragon', 'samurai', 'geisha', 'zen', 'temple'],
    'Candy': ['sweet', 'candy', 'sugar', 'bonanza', 'chocolate']
  };

  const lowerName = name.toLowerCase();
  
  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return theme;
    }
  }
  
  return undefined;
}