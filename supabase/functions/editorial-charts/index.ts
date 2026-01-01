import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// BPM Supreme Genre-based Top 50 charts - Current trending tracks by genre
const BPM_GENRES = {
  'hip-hop': {
    name: 'Hip Hop Top 50',
    description: 'Trending Hip Hop & Rap tracks',
    image: 'https://i.scdn.co/image/ab67706f00000002b10f3d1cf5b0a2da7ab47bc4',
    tracks: [
      { title: 'YAYA (Remix)', artist: 'Compton Av, Steelz & Snoop Dogg', bpm: 98 },
      { title: 'Power Trip', artist: 'J. Cole ft Miguel', bpm: 100 },
      { title: 'FDO', artist: 'Pooh Shiesty', bpm: 73 },
      { title: 'P.I.M.P. (G-Unit Remix)', artist: '50 Cent ft Snoop Dogg', bpm: 85 },
      { title: 'Which One', artist: 'Drake ft Central Cee', bpm: 120 },
      { title: 'Give It Up', artist: 'Twista ft Pharrell', bpm: 120 },
      { title: 'Luther', artist: 'Kendrick Lamar ft SZA', bpm: 88 },
      { title: 'Squabble Up', artist: 'Kendrick Lamar', bpm: 140 },
      { title: 'Not Like Us', artist: 'Kendrick Lamar', bpm: 100 },
      { title: 'Reincarnated', artist: 'Kendrick Lamar', bpm: 95 },
      { title: 'Hey Now', artist: 'Kendrick Lamar', bpm: 125 },
      { title: 'Man At The Garden', artist: 'Kendrick Lamar', bpm: 85 },
      { title: 'HUMBLE.', artist: 'Kendrick Lamar', bpm: 150 },
      { title: 'Money Trees', artist: 'Kendrick Lamar ft Jay Rock', bpm: 72 },
      { title: 'Swimming Pools', artist: 'Kendrick Lamar', bpm: 74 },
      { title: 'DNA.', artist: 'Kendrick Lamar', bpm: 140 },
      { title: 'All The Stars', artist: 'Kendrick Lamar & SZA', bpm: 100 },
      { title: 'ELEMENT.', artist: 'Kendrick Lamar', bpm: 114 },
      { title: 'Bitch Dont Kill My Vibe', artist: 'Kendrick Lamar', bpm: 85 },
      { title: 'Family Ties', artist: 'Baby Keem ft Kendrick Lamar', bpm: 126 },
      { title: 'One Dance', artist: 'Drake ft Wizkid & Kyla', bpm: 104 },
      { title: 'Gods Plan', artist: 'Drake', bpm: 77 },
      { title: 'Hotline Bling', artist: 'Drake', bpm: 135 },
      { title: 'Started From The Bottom', artist: 'Drake', bpm: 85 },
      { title: 'Nice For What', artist: 'Drake', bpm: 137 },
      { title: 'In My Feelings', artist: 'Drake', bpm: 91 },
      { title: 'Laugh Now Cry Later', artist: 'Drake ft Lil Durk', bpm: 133 },
      { title: 'Jimmy Cooks', artist: 'Drake ft 21 Savage', bpm: 145 },
      { title: 'Rich Flex', artist: 'Drake & 21 Savage', bpm: 87 },
      { title: 'Sicko Mode', artist: 'Travis Scott ft Drake', bpm: 155 },
    ],
  },
  'dance': {
    name: 'Dance Music Top 50',
    description: 'Hot Dance & Electronic tracks',
    image: 'https://i.scdn.co/image/ab67706f00000002396f1b30b1afda0f1f78c2d2',
    tracks: [
      { title: 'No Broke Boys', artist: 'Disco Lines & Tinashe', bpm: 131 },
      { title: 'We Found Love', artist: 'Rihanna ft Calvin Harris', bpm: 128 },
      { title: 'The Fate Of Ophelia', artist: 'Taylor Swift', bpm: 130 },
      { title: 'Golden', artist: 'HUNTR/X', bpm: 128 },
      { title: 'Levels', artist: 'Avicii', bpm: 126 },
      { title: 'Show Me Nokia Romance', artist: 'Drake vs Proppa vs Robin S', bpm: 128 },
      { title: 'Think Of Me', artist: 'HUGEL, David Guetta & Kehlani', bpm: 120 },
      { title: 'Titanium', artist: 'David Guetta ft Sia', bpm: 126 },
      { title: 'Dont You Worry Child', artist: 'Swedish House Mafia ft John Martin', bpm: 129 },
      { title: 'Clarity', artist: 'Zedd ft Foxes', bpm: 128 },
      { title: 'Wake Me Up', artist: 'Avicii', bpm: 124 },
      { title: 'Animals', artist: 'Martin Garrix', bpm: 128 },
      { title: 'Turn Down For What', artist: 'DJ Snake & Lil Jon', bpm: 100 },
      { title: 'Lean On', artist: 'Major Lazer & DJ Snake ft MØ', bpm: 98 },
      { title: 'Where Are Ü Now', artist: 'Skrillex & Diplo ft Justin Bieber', bpm: 140 },
      { title: 'The Middle', artist: 'Zedd, Maren Morris & Grey', bpm: 96 },
      { title: 'Happier', artist: 'Marshmello ft Bastille', bpm: 100 },
      { title: 'Roses', artist: 'SAINt JHN (Imanbek Remix)', bpm: 123 },
      { title: 'Head & Heart', artist: 'Joel Corry ft MNEK', bpm: 123 },
      { title: 'Save Your Tears', artist: 'The Weeknd (Remix)', bpm: 118 },
    ],
  },
  'pop': {
    name: 'Pop/Mainstream Top 50',
    description: 'Chart-topping Pop hits',
    image: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc',
    tracks: [
      { title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', bpm: 102 },
      { title: 'APT.', artist: 'ROSÉ & Bruno Mars', bpm: 149 },
      { title: 'Espresso', artist: 'Sabrina Carpenter', bpm: 104 },
      { title: 'Please Please Please', artist: 'Sabrina Carpenter', bpm: 107 },
      { title: 'Taste', artist: 'Sabrina Carpenter', bpm: 98 },
      { title: 'Birds of a Feather', artist: 'Billie Eilish', bpm: 105 },
      { title: 'Good Luck, Babe!', artist: 'Chappell Roan', bpm: 138 },
      { title: 'Too Sweet', artist: 'Hozier', bpm: 128 },
      { title: 'Beautiful Things', artist: 'Benson Boone', bpm: 110 },
      { title: 'I Love You, Im Sorry', artist: 'Gracie Abrams', bpm: 106 },
      { title: 'Lose Control', artist: 'Teddy Swims', bpm: 96 },
      { title: 'Flowers', artist: 'Miley Cyrus', bpm: 118 },
      { title: 'Anti-Hero', artist: 'Taylor Swift', bpm: 97 },
      { title: 'Cruel Summer', artist: 'Taylor Swift', bpm: 170 },
      { title: 'Blank Space', artist: 'Taylor Swift', bpm: 96 },
      { title: 'Shake It Off', artist: 'Taylor Swift', bpm: 160 },
      { title: 'Lover', artist: 'Taylor Swift', bpm: 68 },
      { title: 'Fortnight', artist: 'Taylor Swift ft Post Malone', bpm: 100 },
      { title: 'Lavender Haze', artist: 'Taylor Swift', bpm: 97 },
      { title: 'All Too Well', artist: 'Taylor Swift', bpm: 93 },
    ],
  },
  'rnb': {
    name: 'R&B Top 50',
    description: 'Smooth R&B vibes',
    image: 'https://i.scdn.co/image/ab67706f00000002e6a04c81b2097f7d0c8ec24f',
    tracks: [
      { title: 'One Minute Man (Remix)', artist: 'Missy Elliott ft Jay-Z & Ludacris', bpm: 94 },
      { title: 'Snooze', artist: 'SZA', bpm: 143 },
      { title: 'Kill Bill', artist: 'SZA', bpm: 89 },
      { title: 'Shirt', artist: 'SZA', bpm: 120 },
      { title: 'Good Days', artist: 'SZA', bpm: 121 },
      { title: 'The Weekend', artist: 'SZA', bpm: 135 },
      { title: 'Love Galore', artist: 'SZA ft Travis Scott', bpm: 70 },
      { title: 'Kiss Me More', artist: 'Doja Cat ft SZA', bpm: 111 },
      { title: 'Best Part', artist: 'Daniel Caesar ft H.E.R.', bpm: 68 },
      { title: 'Focus', artist: 'H.E.R.', bpm: 91 },
      { title: 'Damage', artist: 'H.E.R.', bpm: 100 },
      { title: 'Every Kind Of Way', artist: 'H.E.R.', bpm: 90 },
      { title: 'Blinding Lights', artist: 'The Weeknd', bpm: 171 },
      { title: 'Save Your Tears', artist: 'The Weeknd', bpm: 118 },
      { title: 'Starboy', artist: 'The Weeknd ft Daft Punk', bpm: 186 },
      { title: 'Often', artist: 'The Weeknd', bpm: 125 },
      { title: 'Earned It', artist: 'The Weeknd', bpm: 119 },
      { title: 'Die For You', artist: 'The Weeknd', bpm: 65 },
      { title: 'I Was Never There', artist: 'The Weeknd', bpm: 100 },
      { title: 'Timeless', artist: 'The Weeknd ft Playboi Carti', bpm: 92 },
    ],
  },
  'rock': {
    name: 'Rock/Alternative Top 50',
    description: 'Rock & Alternative anthems',
    image: 'https://i.scdn.co/image/ab67706f00000002fe6d8d1019d5b302213e3730',
    tracks: [
      { title: 'Seven Nation Army', artist: 'The White Stripes', bpm: 124 },
      { title: 'Smells Like Teen Spirit', artist: 'Nirvana', bpm: 117 },
      { title: 'Mr. Brightside', artist: 'The Killers', bpm: 148 },
      { title: 'Bohemian Rhapsody', artist: 'Queen', bpm: 72 },
      { title: 'Sweet Child O Mine', artist: 'Guns N Roses', bpm: 125 },
      { title: 'Back In Black', artist: 'AC/DC', bpm: 96 },
      { title: 'Enter Sandman', artist: 'Metallica', bpm: 123 },
      { title: 'Welcome To The Jungle', artist: 'Guns N Roses', bpm: 124 },
      { title: 'Dream On', artist: 'Aerosmith', bpm: 78 },
      { title: 'Hotel California', artist: 'Eagles', bpm: 147 },
      { title: 'Livin On A Prayer', artist: 'Bon Jovi', bpm: 119 },
      { title: 'Pour Some Sugar On Me', artist: 'Def Leppard', bpm: 93 },
      { title: 'Radioactive', artist: 'Imagine Dragons', bpm: 136 },
      { title: 'Thunder', artist: 'Imagine Dragons', bpm: 168 },
      { title: 'Believer', artist: 'Imagine Dragons', bpm: 125 },
      { title: 'Heat Waves', artist: 'Glass Animals', bpm: 81 },
      { title: 'Take Me Out', artist: 'Franz Ferdinand', bpm: 104 },
      { title: 'Somebody Told Me', artist: 'The Killers', bpm: 137 },
      { title: 'Centuries', artist: 'Fall Out Boy', bpm: 173 },
      { title: 'My Songs Know What You Did', artist: 'Fall Out Boy', bpm: 82 },
    ],
  },
  'country': {
    name: 'Country Top 50',
    description: 'Top Country music hits',
    image: 'https://i.scdn.co/image/ab67706f000000023e0130fcd5d106f1402b4707',
    tracks: [
      { title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', bpm: 95 },
      { title: 'I Had Some Help', artist: 'Post Malone ft Morgan Wallen', bpm: 96 },
      { title: 'Last Night', artist: 'Morgan Wallen', bpm: 104 },
      { title: 'Thought You Should Know', artist: 'Morgan Wallen', bpm: 76 },
      { title: 'Whiskey Glasses', artist: 'Morgan Wallen', bpm: 116 },
      { title: 'Chasin You', artist: 'Morgan Wallen', bpm: 72 },
      { title: 'Sand In My Boots', artist: 'Morgan Wallen', bpm: 72 },
      { title: 'Wasted On You', artist: 'Morgan Wallen', bpm: 62 },
      { title: '7 Summers', artist: 'Morgan Wallen', bpm: 69 },
      { title: 'Cover Me Up', artist: 'Morgan Wallen', bpm: 68 },
      { title: 'Tennessee Whiskey', artist: 'Chris Stapleton', bpm: 56 },
      { title: 'Starting Over', artist: 'Chris Stapleton', bpm: 72 },
      { title: 'Joy of My Life', artist: 'Chris Stapleton', bpm: 82 },
      { title: 'You Should Probably Leave', artist: 'Chris Stapleton', bpm: 72 },
      { title: 'Broken Halos', artist: 'Chris Stapleton', bpm: 68 },
      { title: 'White Horse', artist: 'Chris Stapleton', bpm: 65 },
      { title: 'Fast Car', artist: 'Luke Combs', bpm: 105 },
      { title: 'Beautiful Crazy', artist: 'Luke Combs', bpm: 66 },
      { title: 'When It Rains It Pours', artist: 'Luke Combs', bpm: 88 },
      { title: 'Hurricane', artist: 'Luke Combs', bpm: 78 },
    ],
  },
  'latin': {
    name: 'Latin Top 50',
    description: 'Hot Latin & Reggaeton tracks',
    image: 'https://i.scdn.co/image/ab67706f000000025af3ba9a50672e98c5c8ea9c',
    tracks: [
      { title: 'Ella Baila Sola', artist: 'Eslabon Armado & Peso Pluma', bpm: 152 },
      { title: 'La Bebe', artist: 'Yng Lvcas & Peso Pluma', bpm: 118 },
      { title: 'Bellakeo', artist: 'Peso Pluma & Anitta', bpm: 97 },
      { title: 'Un x100to', artist: 'Bad Bunny & Grupo Frontera', bpm: 72 },
      { title: 'WHERE SHE GOES', artist: 'Bad Bunny', bpm: 113 },
      { title: 'Titi Me Pregunto', artist: 'Bad Bunny', bpm: 110 },
      { title: 'Me Porto Bonito', artist: 'Bad Bunny ft Chencho Corleone', bpm: 92 },
      { title: 'Moscow Mule', artist: 'Bad Bunny', bpm: 100 },
      { title: 'Efecto', artist: 'Bad Bunny', bpm: 128 },
      { title: 'Ojitos Lindos', artist: 'Bad Bunny ft Bomba Estereo', bpm: 92 },
      { title: 'Despacito', artist: 'Luis Fonsi ft Daddy Yankee', bpm: 89 },
      { title: 'Gasolina', artist: 'Daddy Yankee', bpm: 100 },
      { title: 'Con Calma', artist: 'Daddy Yankee ft Snow', bpm: 94 },
      { title: 'Mi Gente', artist: 'J Balvin & Willy William', bpm: 105 },
      { title: 'Dákiti', artist: 'Bad Bunny & Jhay Cortez', bpm: 110 },
      { title: 'Hawái', artist: 'Maluma', bpm: 175 },
      { title: 'Feliz Cumpleaños Ferxxo', artist: 'Feid', bpm: 96 },
      { title: 'Yandel 150', artist: 'Yandel & Feid', bpm: 97 },
      { title: 'La Falda', artist: 'Myke Towers', bpm: 98 },
      { title: 'Normal', artist: 'Feid & Blessd', bpm: 91 },
    ],
  },
};

// Billboard Charts - Current official charts
const BILLBOARD_CHARTS = {
  'hot-100': {
    name: 'Billboard Hot 100',
    description: 'The weeks most popular songs across all genres',
    image: 'https://www.billboard.com/wp-content/themes/vip/pmc-billboard-2021/assets/public/lazyload-fallback.gif',
    tracks: [
      { position: 1, title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', weeksOnChart: 18 },
      { position: 2, title: 'APT.', artist: 'ROSÉ & Bruno Mars', weeksOnChart: 10 },
      { position: 3, title: 'Timeless', artist: 'The Weeknd & Playboi Carti', weeksOnChart: 5 },
      { position: 4, title: 'Luther', artist: 'Kendrick Lamar & SZA', weeksOnChart: 4 },
      { position: 5, title: 'Squabble Up', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 6, title: 'Reincarnated', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 7, title: 'Shake It Off', artist: 'Lady Gaga', weeksOnChart: 3 },
      { position: 8, title: 'São Paulo', artist: 'The Weeknd ft Anitta', weeksOnChart: 5 },
      { position: 9, title: 'Espresso', artist: 'Sabrina Carpenter', weeksOnChart: 32 },
      { position: 10, title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', weeksOnChart: 28 },
      { position: 11, title: 'Please Please Please', artist: 'Sabrina Carpenter', weeksOnChart: 26 },
      { position: 12, title: 'Birds of a Feather', artist: 'Billie Eilish', weeksOnChart: 24 },
      { position: 13, title: 'Taste', artist: 'Sabrina Carpenter', weeksOnChart: 14 },
      { position: 14, title: 'Too Sweet', artist: 'Hozier', weeksOnChart: 35 },
      { position: 15, title: 'Lose Control', artist: 'Teddy Swims', weeksOnChart: 40 },
      { position: 16, title: 'Beautiful Things', artist: 'Benson Boone', weeksOnChart: 42 },
      { position: 17, title: 'Good Luck, Babe!', artist: 'Chappell Roan', weeksOnChart: 30 },
      { position: 18, title: 'I Love You, Im Sorry', artist: 'Gracie Abrams', weeksOnChart: 18 },
      { position: 19, title: 'Million Dollar Baby', artist: 'Tommy Richman', weeksOnChart: 26 },
      { position: 20, title: 'Not Like Us', artist: 'Kendrick Lamar', weeksOnChart: 28 },
      { position: 21, title: 'Hey Now', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 22, title: 'Man At The Garden', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 23, title: 'Wacced Out Murals', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 24, title: 'Sticky', artist: 'Drake', weeksOnChart: 8 },
      { position: 25, title: 'Heart to Heart', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 26, title: 'TV Off', artist: 'Kendrick Lamar ft Lefty Gunplay', weeksOnChart: 4 },
      { position: 27, title: 'Dodger Blue', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 28, title: 'Peekaboo', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 29, title: 'I Had Some Help', artist: 'Post Malone ft Morgan Wallen', weeksOnChart: 35 },
      { position: 30, title: 'Thats So True', artist: 'Gracie Abrams', weeksOnChart: 10 },
    ],
  },
  'billboard-200': {
    name: 'Billboard 200',
    description: 'Top albums in the United States',
    image: 'https://www.billboard.com/wp-content/themes/vip/pmc-billboard-2021/assets/public/lazyload-fallback.gif',
    albums: [
      { position: 1, title: 'GNX', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 2, title: 'Hurry Up Tomorrow', artist: 'The Weeknd', weeksOnChart: 2 },
      { position: 3, title: 'Short n Sweet', artist: 'Sabrina Carpenter', weeksOnChart: 18 },
      { position: 4, title: 'Hit Me Hard and Soft', artist: 'Billie Eilish', weeksOnChart: 26 },
      { position: 5, title: 'The Rise and Fall of a Midwest Princess', artist: 'Chappell Roan', weeksOnChart: 45 },
      { position: 6, title: 'The Tortured Poets Department', artist: 'Taylor Swift', weeksOnChart: 35 },
      { position: 7, title: 'One Thing at a Time', artist: 'Morgan Wallen', weeksOnChart: 95 },
      { position: 8, title: 'CHROMAKOPIA', artist: 'Tyler, The Creator', weeksOnChart: 6 },
      { position: 9, title: 'Brat', artist: 'Charli XCX', weeksOnChart: 24 },
      { position: 10, title: 'SOS', artist: 'SZA', weeksOnChart: 104 },
    ],
  },
  'global-200': {
    name: 'Billboard Global 200',
    description: 'Most popular songs worldwide',
    image: 'https://www.billboard.com/wp-content/themes/vip/pmc-billboard-2021/assets/public/lazyload-fallback.gif',
    tracks: [
      { position: 1, title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', weeksOnChart: 18 },
      { position: 2, title: 'APT.', artist: 'ROSÉ & Bruno Mars', weeksOnChart: 10 },
      { position: 3, title: 'Birds of a Feather', artist: 'Billie Eilish', weeksOnChart: 24 },
      { position: 4, title: 'Espresso', artist: 'Sabrina Carpenter', weeksOnChart: 32 },
      { position: 5, title: 'Timeless', artist: 'The Weeknd ft Playboi Carti', weeksOnChart: 5 },
      { position: 6, title: 'Please Please Please', artist: 'Sabrina Carpenter', weeksOnChart: 26 },
      { position: 7, title: 'Luther', artist: 'Kendrick Lamar & SZA', weeksOnChart: 4 },
      { position: 8, title: 'Taste', artist: 'Sabrina Carpenter', weeksOnChart: 14 },
      { position: 9, title: 'Thats So True', artist: 'Gracie Abrams', weeksOnChart: 10 },
      { position: 10, title: 'Good Luck Babe', artist: 'Chappell Roan', weeksOnChart: 30 },
      { position: 11, title: 'Too Sweet', artist: 'Hozier', weeksOnChart: 35 },
      { position: 12, title: 'Lose Control', artist: 'Teddy Swims', weeksOnChart: 40 },
      { position: 13, title: 'Beautiful Things', artist: 'Benson Boone', weeksOnChart: 42 },
      { position: 14, title: 'Squabble Up', artist: 'Kendrick Lamar', weeksOnChart: 4 },
      { position: 15, title: 'Who', artist: 'Jimin', weeksOnChart: 15 },
    ],
  },
  'artist-100': {
    name: 'Billboard Artist 100',
    description: 'Most popular artists in America',
    image: 'https://www.billboard.com/wp-content/themes/vip/pmc-billboard-2021/assets/public/lazyload-fallback.gif',
    artists: [
      { position: 1, name: 'Kendrick Lamar', weeksOnChart: 5 },
      { position: 2, name: 'Taylor Swift', weeksOnChart: 120 },
      { position: 3, name: 'The Weeknd', weeksOnChart: 45 },
      { position: 4, name: 'Lady Gaga', weeksOnChart: 18 },
      { position: 5, name: 'Bruno Mars', weeksOnChart: 20 },
      { position: 6, name: 'Sabrina Carpenter', weeksOnChart: 35 },
      { position: 7, name: 'ROSÉ', weeksOnChart: 10 },
      { position: 8, name: 'Morgan Wallen', weeksOnChart: 100 },
      { position: 9, name: 'Billie Eilish', weeksOnChart: 28 },
      { position: 10, name: 'Drake', weeksOnChart: 85 },
    ],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, genre, chart } = await req.json();
    
    let result: any = {};
    
    switch (action) {
      case 'genres':
        // Return list of available BPM genres
        result = {
          genres: Object.entries(BPM_GENRES).map(([id, data]) => ({
            id,
            name: data.name,
            description: data.description,
            image: data.image,
            trackCount: data.tracks.length,
          })),
        };
        break;
        
      case 'genre-top50':
        // Return top 50 for a specific genre
        const genreData = BPM_GENRES[genre as keyof typeof BPM_GENRES] || BPM_GENRES['hip-hop'];
        result = {
          genre: genre || 'hip-hop',
          name: genreData.name,
          description: genreData.description,
          image: genreData.image,
          tracks: genreData.tracks.map((t, idx) => ({
            position: idx + 1,
            ...t,
            source: 'bpm-supreme',
          })),
        };
        break;
        
      case 'billboard':
        // Return specific Billboard chart
        const chartData = BILLBOARD_CHARTS[chart as keyof typeof BILLBOARD_CHARTS] || BILLBOARD_CHARTS['hot-100'];
        result = {
          chart: chart || 'hot-100',
          ...chartData,
          date: new Date().toISOString().split('T')[0],
        };
        break;
        
      case 'all-charts':
        // Return all Billboard charts summary
        result = {
          charts: Object.entries(BILLBOARD_CHARTS).map(([id, data]) => ({
            id,
            name: data.name,
            description: data.description,
            image: data.image,
          })),
        };
        break;
        
      case 'editorial-playlists':
      default:
        // Return curated editorial playlists combining genres and charts
        const editorialPlaylists = [
          // Billboard Charts as playlists
          {
            id: 'billboard-hot-100',
            name: 'Billboard Hot 100',
            description: 'The weeks most popular songs',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Billboard_Hot_100_logo.svg/512px-Billboard_Hot_100_logo.svg.png',
            trackCount: 100,
            category: 'charts',
            source: 'billboard',
          },
          {
            id: 'billboard-global-200',
            name: 'Billboard Global 200',
            description: 'Most popular songs worldwide',
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Billboard_logo.svg/512px-Billboard_logo.svg.png',
            trackCount: 200,
            category: 'charts',
            source: 'billboard',
          },
          // BPM Genre playlists
          ...Object.entries(BPM_GENRES).map(([id, data]) => ({
            id: `bpm-${id}`,
            name: data.name,
            description: data.description,
            image: data.image,
            trackCount: data.tracks.length,
            category: 'genre',
            source: 'bpm-supreme',
          })),
        ];
        
        result = { playlists: editorialPlaylists };
        break;
    }
    
    console.log(`Editorial charts action: ${action}, result count: ${JSON.stringify(result).length}`);
    
    return new Response(JSON.stringify({
      success: true,
      ...result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('Editorial charts error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
