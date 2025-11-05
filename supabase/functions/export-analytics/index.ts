import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  type: 'track' | 'album';
  id: string;
  title: string;
  artistName: string;
  analytics: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { type, id, title, artistName, analytics }: ExportRequest = await req.json();

    console.log(`Generating ${type} analytics PDF for ${title} by ${artistName}`);

    // Generate HTML content for PDF
    const htmlContent = generateHTMLReport(type, title, artistName, analytics);

    // Return HTML that can be converted to PDF client-side
    return new Response(
      JSON.stringify({
        success: true,
        html: htmlContent,
        filename: `${type}-analytics-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in export-analytics function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function generateHTMLReport(type: string, title: string, artistName: string, analytics: any): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const isTrack = type === 'track';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${isTrack ? 'Track' : 'Album'} Analytics Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #8B5CF6;
        }
        .header h1 {
          margin: 0;
          font-size: 36px;
          color: #8B5CF6;
        }
        .header h2 {
          margin: 10px 0;
          font-size: 24px;
          color: #555;
        }
        .header p {
          margin: 5px 0;
          color: #777;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .metric-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #8B5CF6;
        }
        .metric-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
        }
        .metric-card .value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }
        .metric-card .subtext {
          font-size: 12px;
          color: #888;
          margin-top: 5px;
        }
        .section {
          margin: 40px 0;
        }
        .section h2 {
          font-size: 24px;
          color: #333;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #eee;
        }
        .engagement-bar {
          margin: 15px 0;
        }
        .engagement-bar .label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .engagement-bar .bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        .engagement-bar .bar .fill {
          height: 100%;
          background: linear-gradient(90deg, #8B5CF6, #C084FC);
          transition: width 0.3s;
        }
        .demographics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .demo-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        .demo-section h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #333;
        }
        .demo-item {
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .demo-item:last-child {
          border-bottom: none;
        }
        .demo-item .demo-label {
          font-size: 13px;
          color: #666;
        }
        .demo-item .demo-value {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
        .platform-list {
          list-style: none;
          padding: 0;
        }
        .platform-list li {
          padding: 12px;
          margin: 8px 0;
          background: #f8f9fa;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .platform-list li .name {
          font-weight: 600;
          color: #333;
        }
        .platform-list li .value {
          color: #8B5CF6;
          font-weight: bold;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          text-align: center;
          color: #888;
          font-size: 12px;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin: 0 4px;
        }
        .badge-success {
          background: #d1fae5;
          color: #065f46;
        }
        .badge-warning {
          background: #fee2e2;
          color: #991b1b;
        }
        .badge-info {
          background: #dbeafe;
          color: #1e40af;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <h2>${artistName}</h2>
        <p>${isTrack ? 'Track' : 'Album'} Analytics Report</p>
        <p>Generated on ${currentDate}</p>
      </div>

      <div class="section">
        <h2>Key Performance Metrics</h2>
        <div class="metrics-grid">
          ${isTrack ? `
            <div class="metric-card">
              <h3>Total Streams</h3>
              <div class="value">${analytics.streams?.toLocaleString() || 0}</div>
            </div>
            <div class="metric-card">
              <h3>Total Likes</h3>
              <div class="value">${analytics.likes?.toLocaleString() || 0}</div>
              <div class="subtext">${analytics.likeRate?.toFixed(1) || 0}% of streams</div>
            </div>
            <div class="metric-card">
              <h3>Comments</h3>
              <div class="value">${analytics.comments?.toLocaleString() || 0}</div>
              <div class="subtext">${analytics.commentRate?.toFixed(1) || 0}% engagement</div>
            </div>
            <div class="metric-card">
              <h3>Est. Revenue</h3>
              <div class="value">$${analytics.revenue?.toFixed(2) || '0.00'}</div>
              <div class="subtext">$0.003 per stream avg</div>
            </div>
          ` : `
            <div class="metric-card">
              <h3>Total Streams</h3>
              <div class="value">${analytics.totalStreams?.toLocaleString() || 0}</div>
            </div>
            <div class="metric-card">
              <h3>Estimated Revenue</h3>
              <div class="value">$${analytics.totalRevenue?.toFixed(2) || '0.00'}</div>
              <div class="subtext">$0.003 per stream avg</div>
            </div>
            <div class="metric-card">
              <h3>Total Tracks</h3>
              <div class="value">${analytics.totalTracks || 0}</div>
            </div>
            <div class="metric-card">
              <h3>Total Listeners</h3>
              <div class="value">${analytics.totalListeners?.toLocaleString() || 0}</div>
              <div class="subtext">Unique listeners</div>
            </div>
          `}
        </div>
      </div>

      ${isTrack ? `
        <div class="section">
          <h2>Engagement Metrics</h2>
          <div class="engagement-bar">
            <div class="label">
              <span>Completion Rate</span>
              <span>${analytics.completionRate?.toFixed(1) || 0}%</span>
            </div>
            <div class="bar">
              <div class="fill" style="width: ${analytics.completionRate || 0}%"></div>
            </div>
          </div>
          <div class="engagement-bar">
            <div class="label">
              <span>Like Rate</span>
              <span>${analytics.likeRate?.toFixed(1) || 0}%</span>
            </div>
            <div class="bar">
              <div class="fill" style="width: ${analytics.likeRate || 0}%"></div>
            </div>
          </div>
          <div class="engagement-bar">
            <div class="label">
              <span>Engagement Rate</span>
              <span>${analytics.engagementRate?.toFixed(1) || 0}%</span>
            </div>
            <div class="bar">
              <div class="fill" style="width: ${Math.min(analytics.engagementRate || 0, 100)}%"></div>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            ${analytics.completionRate > 80 ? '<span class="badge badge-success">High Completion</span>' : ''}
            ${analytics.skipRate > 40 ? '<span class="badge badge-warning">High Skip Rate</span>' : ''}
            ${analytics.likeRate > 5 ? '<span class="badge badge-info">High Like Rate</span>' : ''}
            ${analytics.engagementRate > 5 ? '<span class="badge badge-success">Strong Engagement</span>' : ''}
          </div>
        </div>
      ` : ''}

      ${analytics.platformData || analytics.platformBreakdown ? `
        <div class="section">
          <h2>Platform Distribution</h2>
          <ul class="platform-list">
            ${(analytics.platformData || analytics.platformBreakdown)?.map((platform: any) => `
              <li>
                <span class="name">${platform.name}</span>
                <span class="value">${platform.streams?.toLocaleString() || platform.value?.toLocaleString() || 0} streams</span>
              </li>
            `).join('') || ''}
          </ul>
        </div>
      ` : ''}

      ${isTrack && analytics.demographics ? `
        <div class="section">
          <h2>Listener Demographics</h2>
          <div class="demographics">
            <div class="demo-section">
              <h3>Age Groups</h3>
              ${analytics.demographics.ageGroups?.map((age: any) => `
                <div class="demo-item">
                  <div class="demo-label">${age.range}</div>
                  <div class="demo-value">${age.percentage?.toFixed(1) || 0}%</div>
                </div>
              `).join('') || ''}
            </div>
            <div class="demo-section">
              <h3>Gender Split</h3>
              ${analytics.demographics.gender?.map((gender: any) => `
                <div class="demo-item">
                  <div class="demo-label">${gender.type}</div>
                  <div class="demo-value">${gender.percentage?.toFixed(0) || 0}%</div>
                </div>
              `).join('') || ''}
            </div>
            <div class="demo-section">
              <h3>Top Locations</h3>
              ${analytics.demographics.topLocations?.map((location: any, idx: number) => `
                <div class="demo-item">
                  <div class="demo-label">#${idx + 1} ${location.city}</div>
                  <div class="demo-value">${location.streams?.toLocaleString() || 0}</div>
                </div>
              `).join('') || ''}
            </div>
          </div>
        </div>
      ` : ''}

      ${!isTrack && analytics.topTrack ? `
        <div class="section">
          <h2>Top Performing Track</h2>
          <div class="metric-card" style="margin: 0;">
            <h3 style="font-size: 18px; color: #333; text-transform: none; margin-bottom: 10px;">${analytics.topTrack.title}</h3>
            <div class="metrics-grid">
              <div>
                <div class="demo-label">Streams</div>
                <div class="demo-value">${analytics.topTrack.play_count?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div class="demo-label">Est. Earnings</div>
                <div class="demo-value">$${((analytics.topTrack.play_count || 0) * 0.003).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p>This analytics report was generated by TDZ Music Platform</p>
        <p>Data is based on platform metrics and industry-standard estimations</p>
      </div>
    </body>
    </html>
  `;
}
