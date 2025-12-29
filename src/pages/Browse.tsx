import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Grid3X3, LayoutList, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/contexts/PlayerContext';
import { BrowseSidebar } from '@/components/browse/BrowseSidebar';
import { BrowseGrid } from '@/components/browse/BrowseGrid';
import { BrowseFilters } from '@/components/browse/BrowseFilters';
import { cn } from '@/lib/utils';

type ContentType = 'albums' | 'tracks' | 'artists' | 'playlists';

interface FilterState {
  search: string;
  sortBy: string;
  genre: string[];
  type: string;
  priceRange: 'all' | 'free' | 'priced';
  artist: string;
}

const ITEMS_PER_PAGE = 24;

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { playTrack } = usePlayer();
  
  const [contentType, setContentType] = useState<ContentType>(
    (searchParams.get('type') as ContentType) || 'albums'
  );
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('q') || '',
    sortBy: 'newest',
    genre: [],
    type: 'all',
    priceRange: 'all',
    artist: '',
  });

  // Fetch content based on type and filters
  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      let query;
      const offset = (page - 1) * ITEMS_PER_PAGE;

      if (contentType === 'albums') {
        query = supabase
          .from('albums')
          .select('*', { count: 'exact' })
          .eq('is_published', true);
        
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,artist_name.ilike.%${filters.search}%`);
        }
        if (filters.genre.length > 0) {
          query = query.in('genre', filters.genre);
        }
        
        switch (filters.sortBy) {
          case 'title': query = query.order('title'); break;
          case 'plays': query = query.order('play_count', { ascending: false }); break;
          case 'newest': default: query = query.order('created_at', { ascending: false });
        }
      } else if (contentType === 'tracks') {
        query = supabase
          .from('tracks')
          .select('*', { count: 'exact' })
          .eq('is_published', true);
        
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,artist_name.ilike.%${filters.search}%`);
        }
        
        switch (filters.sortBy) {
          case 'title': query = query.order('title'); break;
          case 'plays': query = query.order('play_count', { ascending: false }); break;
          case 'duration': query = query.order('duration', { ascending: false }); break;
          case 'newest': default: query = query.order('created_at', { ascending: false });
        }
      } else if (contentType === 'artists') {
        query = supabase
          .from('artist_profiles')
          .select('*', { count: 'exact' });
        
        if (filters.search) {
          query = query.ilike('artist_name', `%${filters.search}%`);
        }
        
        switch (filters.sortBy) {
          case 'name': query = query.order('artist_name'); break;
          case 'listeners': query = query.order('monthly_listeners', { ascending: false }); break;
          case 'plays': query = query.order('total_plays', { ascending: false }); break;
          default: query = query.order('created_at', { ascending: false });
        }
      } else if (contentType === 'playlists') {
        query = supabase
          .from('playlists')
          .select('*', { count: 'exact' })
          .eq('is_public', true);
        
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }
        
        switch (filters.sortBy) {
          case 'name': query = query.order('name'); break;
          case 'plays': query = query.order('play_count', { ascending: false }); break;
          default: query = query.order('created_at', { ascending: false });
        }
      }

      const { data, count, error } = await query!
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      setItems(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  }, [contentType, filters, page]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (contentType !== 'albums') params.set('type', contentType);
    if (filters.search) params.set('q', filters.search);
    if (page > 1) params.set('page', String(page));
    setSearchParams(params, { replace: true });
  }, [contentType, filters.search, page, setSearchParams]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPage(1);
  };

  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    setPage(1);
    setFilters(prev => ({ ...prev, genre: [], type: 'all' }));
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatCount = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <div className={cn(
        "hidden lg:flex flex-col w-64 border-r border-border/50 bg-card/30",
        "transition-all duration-300",
        !sidebarOpen && "w-0 overflow-hidden"
      )}>
        <BrowseSidebar
          currentType={contentType}
          onTypeChange={handleContentTypeChange}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-4 p-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Grid3X3 className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <BrowseSidebar
                  currentType={contentType}
                  onTypeChange={(type) => {
                    handleContentTypeChange(type);
                  }}
                />
              </SheetContent>
            </Sheet>

            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${contentType}...`}
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-muted/50 border-border/50"
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => handleSearch('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Toggle */}
            <Button
              variant={filterOpen ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter className="h-5 w-5" />
            </Button>

            {/* View Toggle */}
            <div className="hidden sm:flex items-center gap-1 border border-border/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {filterOpen && (
            <BrowseFilters
              contentType={contentType}
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </header>

        {/* Content Header */}
        <div className="px-4 py-6 border-b border-border/30">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight capitalize">
              {contentType}
            </h1>
            <Badge variant="secondary" className="text-sm font-mono">
              {formatCount(totalCount)}
            </Badge>
          </div>
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1">
          <BrowseGrid
            items={items}
            contentType={contentType}
            viewMode={viewMode}
            loading={loading}
            onItemClick={(item) => {
              if (contentType === 'albums') navigate(`/album/${item.id}`);
              else if (contentType === 'tracks') playTrack(item, items);
              else if (contentType === 'artists') navigate(`/artist/${item.user_id}`);
              else if (contentType === 'playlists') navigate(`/playlist/${item.id}`);
            }}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 p-6 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground font-mono">
                {page} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
