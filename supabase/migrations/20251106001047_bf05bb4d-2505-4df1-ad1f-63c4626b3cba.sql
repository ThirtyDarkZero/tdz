-- Create table for label staff conversations
CREATE TABLE public.label_staff_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_member_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for label staff messages
CREATE TABLE public.label_staff_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.label_staff_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.label_staff_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_staff_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON public.label_staff_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.label_staff_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.label_staff_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.label_staff_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.label_staff_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.label_staff_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create messages in their conversations"
  ON public.label_staff_messages
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.label_staff_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON public.label_staff_conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.label_staff_conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.label_staff_messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON public.label_staff_messages(timestamp);

-- Create function to update conversation timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.label_staff_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update conversation timestamp when messages are added
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON public.label_staff_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_updated_at();