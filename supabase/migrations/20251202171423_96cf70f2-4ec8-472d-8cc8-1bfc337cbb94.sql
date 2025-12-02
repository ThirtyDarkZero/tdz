-- Create exec agent conversations table for CEO
CREATE TABLE public.exec_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_type TEXT NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exec agent messages table
CREATE TABLE public.exec_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.exec_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exec_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_messages ENABLE ROW LEVEL SECURITY;

-- CEO-only policies for conversations
CREATE POLICY "CEO can view own exec conversations" 
ON public.exec_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "CEO can create exec conversations" 
ON public.exec_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "CEO can update own exec conversations" 
ON public.exec_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "CEO can delete own exec conversations" 
ON public.exec_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "CEO can view exec messages" 
ON public.exec_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.exec_conversations 
    WHERE id = exec_messages.conversation_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "CEO can insert exec messages" 
ON public.exec_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exec_conversations 
    WHERE id = exec_messages.conversation_id 
    AND user_id = auth.uid()
  )
);

-- Updated_at trigger
CREATE TRIGGER update_exec_conversations_updated_at
BEFORE UPDATE ON public.exec_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();