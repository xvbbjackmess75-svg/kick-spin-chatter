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

    console.log('Starting comprehensive slot data import from ALL pages of aboutslots.com');

    const allSlots: SlotData[] = [];
    const maxPages = 200; // Based on user info
    const batchSize = 10; // Process pages in batches to avoid timeouts

    // Process pages in batches
    for (let batch = 0; batch < Math.ceil(maxPages / batchSize); batch++) {
      const startPage = batch * batchSize + 1;
      const endPage = Math.min((batch + 1) * batchSize, maxPages);
      
      console.log(`Processing batch ${batch + 1}: pages ${startPage}-${endPage}`);

      // Process pages in this batch concurrently
      const pagePromises = [];
      for (let page = startPage; page <= endPage; page++) {
        pagePromises.push(scrapePage(page));
      }

      try {
        const batchResults = await Promise.allSettled(pagePromises);
        
        for (let i = 0; i < batchResults.length; i++) {
          const result = batchResults[i];
          const pageNum = startPage + i;
          
          if (result.status === 'fulfilled') {
            const pageSlots = result.value;
            console.log(`Page ${pageNum}: Found ${pageSlots.length} slots`);
            allSlots.push(...pageSlots);
          } else {
            console.error(`Page ${pageNum} failed:`, result.reason);
          }
        }
      } catch (error) {
        console.error(`Error processing batch ${batch + 1}:`, error);
      }

      // Small delay between batches to be respectful to the server
      if (batch < Math.ceil(maxPages / batchSize) - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Total slots found across all pages: ${allSlots.length}`);

    if (allSlots.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No slots found to import' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Remove duplicates based on name + provider combination
    const uniqueSlots = Array.from(
      new Map(allSlots.map(slot => [`${slot.name.toLowerCase()}-${slot.provider.toLowerCase()}`, slot])).values()
    );

    console.log(`Unique slots after deduplication: ${uniqueSlots.length}`);

    // Get existing slots to avoid duplicates
    const { data: existingSlots } = await supabase
      .from('slots')
      .select('name, provider');

    const existingSlotKeys = new Set(
      (existingSlots || []).map(slot => `${slot.name.toLowerCase()}-${slot.provider.toLowerCase()}`)
    );

    // Filter out duplicates
    const newSlots = uniqueSlots.filter(slot => 
      !existingSlotKeys.has(`${slot.name.toLowerCase()}-${slot.provider.toLowerCase()}`)
    );

    console.log(`New slots to insert: ${newSlots.length}`);

    if (newSlots.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No new slots to import - all slots already exist',
          total_processed: uniqueSlots.length 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert new slots in batches
    const insertBatchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < newSlots.length; i += insertBatchSize) {
      const batch = newSlots.slice(i, i + insertBatchSize);
      
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
      console.log(`Inserted batch ${Math.floor(i / insertBatchSize) + 1}, total inserted: ${insertedCount}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedCount} new slots from ${maxPages} pages`,
        total_found: allSlots.length,
        unique_slots: uniqueSlots.length,
        new_slots_added: insertedCount,
        existing_slots_skipped: uniqueSlots.length - insertedCount
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

async function scrapePage(pageNumber: number): Promise<SlotData[]> {
  try {
    const url = pageNumber === 1 
      ? 'https://www.aboutslots.com/all-casino-slots'
      : `https://www.aboutslots.com/all-casino-slots?page=${pageNumber}`;
    
    console.log(`Scraping page ${pageNumber}: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch page ${pageNumber}: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    return parseSlotData(html, pageNumber);
  } catch (error) {
    console.error(`Error scraping page ${pageNumber}:`, error);
    return [];
  }
}

function parseSlotData(html: string, pageNumber: number): SlotData[] {
  const slots: SlotData[] = [];
  
  try {
    // Look for slot links in the HTML
    const slotLinkRegex = /href="\/casino-slots\/([^"]+)"/g;
    const slotMatches = Array.from(html.matchAll(slotLinkRegex));
    
    console.log(`Page ${pageNumber}: Found ${slotMatches.length} slot links`);
    
    // Also look for slot data in script tags or data attributes
    const scriptDataRegex = /"slug":"([^"]+)"[^}]*"title":"([^"]+)"[^}]*"provider":"([^"]+)"/g;
    const scriptMatches = Array.from(html.matchAll(scriptDataRegex));
    
    console.log(`Page ${pageNumber}: Found ${scriptMatches.length} slot data entries`);
    
    // Process slot links
    for (const match of slotMatches) {
      const slug = match[1];
      if (slug && slug.length > 2) {
        const name = slugToName(slug);
        const provider = extractProviderFromContext(html, slug);
        
        if (name && provider !== 'Unknown') {
          slots.push({
            name,
            provider,
            theme: extractTheme(name),
          });
        }
      }
    }
    
    // Process script data (more reliable when available)
    for (const match of scriptMatches) {
      const [, slug, title, provider] = match;
      if (title && provider) {
        slots.push({
          name: title,
          provider: provider,
          theme: extractTheme(title),
        });
      }
    }
    
    // Look for provider information in the page
    const providerRegex = /data-provider="([^"]+)"/g;
    const providerMatches = Array.from(html.matchAll(providerRegex));
    
    // Also look for game titles in various formats
    const titleRegex = /(?:title|alt)="([^"]*(?:slot|game)[^"]*)"/gi;
    const titleMatches = Array.from(html.matchAll(titleRegex));
    
    // Parse JSON-LD structured data if present
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    const jsonLdMatches = Array.from(html.matchAll(jsonLdRegex));
    
    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData && Array.isArray(jsonData)) {
          for (const item of jsonData) {
            if (item.name && item.provider) {
              slots.push({
                name: item.name,
                provider: item.provider,
                theme: extractTheme(item.name),
              });
            }
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
    
    // Remove duplicates from this page
    const uniqueSlots = Array.from(
      new Map(slots.map(slot => [`${slot.name.toLowerCase()}-${slot.provider.toLowerCase()}`, slot])).values()
    );
    
    console.log(`Page ${pageNumber}: Parsed ${uniqueSlots.length} unique slots`);
    return uniqueSlots;
    
  } catch (error) {
    console.error(`Error parsing page ${pageNumber}:`, error);
    return [];
  }
}

function slugToName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\bAnd\b/g, '&')
    .replace(/\bOf\b/g, 'of')
    .replace(/\bThe\b/g, 'the')
    .replace(/\bIn\b/g, 'in')
    .replace(/\bOn\b/g, 'on')
    .replace(/\bAt\b/g, 'at')
    .replace(/\bTo\b/g, 'to')
    .replace(/\bFor\b/g, 'for');
}

function extractProviderFromContext(html: string, slug: string): string {
  const providers = [
    'Pragmatic Play', 'NetEnt', 'Play\'n GO', 'Microgaming', 'Evolution',
    'Red Tiger', 'Push Gaming', 'Big Time Gaming', 'Blueprint Gaming',
    'Yggdrasil', 'Quickspin', 'Nolimit City', 'Relax Gaming', 'Hacksaw Gaming',
    'Print Studios', 'Elk Studios', 'Thunderkick', 'IGT', 'WMS', 'Bally',
    'Scientific Games', 'Aristocrat', 'Novomatic', 'Merkur', 'Gamomat',
    'Iron Dog Studio', 'Fantasma Games', 'Northern Lights Gaming',
    'Skywind Group', 'Spinomenal', 'Booming Games', 'Endorphina',
    'BGaming', 'Wazdan', 'Playson', 'Tom Horn Gaming', 'Kalamba Games',
    'Octoplay', 'Habanero', 'Betsoft', 'Pragmatic', 'Evoplay',
    'Mascot Gaming', 'Fugaso', 'GameArt', 'iSoftBet', 'Platipus Gaming'
  ];

  // Look for provider in the vicinity of the slot
  const slotIndex = html.toLowerCase().indexOf(slug.toLowerCase());
  if (slotIndex !== -1) {
    const contextStart = Math.max(0, slotIndex - 2000);
    const contextEnd = Math.min(html.length, slotIndex + 2000);
    const context = html.substring(contextStart, contextEnd).toLowerCase();
    
    for (const provider of providers) {
      if (context.includes(provider.toLowerCase())) {
        return provider;
      }
    }
  }
  
  return 'Unknown';
}

function extractTheme(name: string): string | undefined {
  const themes = {
    'Egyptian': ['book', 'pharaoh', 'pyramid', 'cleopatra', 'anubis', 'osiris', 'egypt', 'dead', 'tomb'],
    'Adventure': ['quest', 'treasure', 'explorer', 'adventure', 'jungle', 'hunter', 'temple'],
    'Mythology': ['gods', 'olympus', 'thor', 'loki', 'mythology', 'divine', 'legendary', 'zeus'],
    'Animals': ['wolf', 'bear', 'lion', 'tiger', 'dog', 'cat', 'wild', 'safari', 'rhino', 'elephant'],
    'Fantasy': ['magic', 'wizard', 'dragon', 'fairy', 'enchanted', 'mystical', 'princess'],
    'Fruit': ['fruit', 'cherry', 'lemon', 'orange', 'grape', 'watermelon', 'berry'],
    'Classic': ['777', 'lucky', 'diamond', 'gold', 'classic', 'retro', 'joker'],
    'Ocean': ['ocean', 'sea', 'shark', 'fish', 'underwater', 'marine', 'aqua'],
    'Space': ['star', 'cosmic', 'galaxy', 'space', 'planet', 'nebula', 'alien'],
    'Music': ['rock', 'music', 'band', 'concert', 'disco', 'dance'],
    'Horror': ['vampire', 'ghost', 'halloween', 'scary', 'dark', 'devil', 'demon'],
    'Western': ['cowboy', 'sheriff', 'western', 'saloon', 'outlaw', 'bandit'],
    'Asian': ['dragon', 'samurai', 'geisha', 'zen', 'temple', 'chi', 'luck'],
    'Candy': ['sweet', 'candy', 'sugar', 'bonanza', 'chocolate', 'rush'],
    'Pirates': ['pirate', 'treasure', 'ship', 'captain', 'gold'],
    'Mexican': ['mexican', 'mariachi', 'fiesta', 'chilli', 'pepper'],
    'Mining': ['mine', 'mining', 'gold', 'diamond', 'gems', 'dig'],
    'Fire': ['fire', 'flame', 'hot', 'burn', 'inferno'],
    'Ice': ['ice', 'frozen', 'cold', 'winter', 'snow'],
    'Money': ['money', 'cash', 'bank', 'rich', 'fortune', 'wealth']
  };

  const lowerName = name.toLowerCase();
  
  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return theme;
    }
  }
  
  return undefined;
}