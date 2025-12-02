import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send, Search, MessageCircle, User, Music, CheckCircle, Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Artist = {
  id: string;
  user_id: string;
  artist_name: string;
  profile_image_path: string | null;
  verified: boolean;
  total_plays: number;
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
};

export const CEOArtistMessaging = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadArtists();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedArtist) {
      loadMessages(selectedArtist.user_id);
      const channel = supabase
        .channel('ceo-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        }, (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === selectedArtist.user_id && newMsg.receiver_id === currentUserId) ||
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedArtist.user_id)
          ) {
            setMessages(prev => [...prev, newMsg]);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedArtist, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredArtists(
        artists.filter(a => 
          a.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredArtists(artists);
    }
  }, [searchQuery, artists]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select('id, user_id, artist_name, profile_image_path, verified, total_plays')
        .order('total_plays', { ascending: false });

      if (error) throw error;
      setArtists(data || []);
      setFilteredArtists(data || []);
    } catch (error) {
      console.error('Error loading artists:', error);
    }
  };

  const loadMessages = async (artistUserId: string) => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${artistUserId}),and(sender_id.eq.${artistUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', artistUserId)
        .eq('receiver_id', currentUserId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedArtist || !currentUserId || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedArtist.user_id,
          content: inputMessage.trim()
        });

      if (error) throw error;
      setInputMessage("");
    } catch (error) {
      console.error('Send error:', error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getArtistImageUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('artist-images').getPublicUrl(path);
    return data?.publicUrl;
  };

  return (
    <Card className="h-[500px] flex bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-primary/20 overflow-hidden">
      {/* Artist List */}
      <div className="w-72 border-r border-border/30 flex flex-col">
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Artist Messages</span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm bg-background/50"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredArtists.map(artist => (
            <div
              key={artist.id}
              onClick={() => setSelectedArtist(artist)}
              className={`p-3 cursor-pointer transition-all border-b border-border/10 ${
                selectedArtist?.id === artist.id 
                  ? 'bg-primary/10 border-l-2 border-l-primary' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={getArtistImageUrl(artist.profile_image_path) || undefined} />
                  <AvatarFallback className="bg-primary/20">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm truncate">{artist.artist_name}</span>
                    {artist.verified && (
                      <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Music className="w-3 h-3" />
                    {artist.total_plays?.toLocaleString() || 0} plays
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedArtist ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                  <AvatarImage src={getArtistImageUrl(selectedArtist.profile_image_path) || undefined} />
                  <AvatarFallback className="bg-primary/20">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{selectedArtist.artist_name}</span>
                    {selectedArtist.verified && (
                      <Badge variant="secondary" className="text-[10px]">Verified</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {selectedArtist.total_plays?.toLocaleString() || 0} total plays
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Start the conversation with {selectedArtist.artist_name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender_id === currentUserId
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
                            : 'bg-muted/80'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center gap-1 mt-1 opacity-70">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px]">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-border/30">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${selectedArtist.artist_name}...`}
                  disabled={isLoading}
                  className="flex-1 bg-background/50"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Select an artist</p>
              <p className="text-sm mt-1">Choose an artist to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};