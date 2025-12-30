import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SquareOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting your Square account...');

  useEffect(() => {
    const handleCallback = async () => {
      // Get parameters from URL query string (how OAuth returns them)
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('Square OAuth callback received:', { 
        hasCode: !!code, 
        hasState: !!state, 
        error,
        fullUrl: window.location.href 
      });

      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Authorization was denied');
        toast.error('Square connection failed');
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback - missing authorization code or state');
        console.error('Missing code or state in callback URL');
        return;
      }

      try {
        // Send code and state to edge function for token exchange
        const response = await supabase.functions.invoke('square-oauth-callback', {
          body: { code, state },
        });

        console.log('Square callback response:', response);

        if (response.error) {
          throw new Error(response.error.message || 'Callback processing failed');
        }

        const data = response.data;
        
        if (data.success) {
          setStatus('success');
          setMessage(`Successfully connected to ${data.merchantName || 'Square'}!`);
          toast.success('Square account connected! You can now receive payouts.');
        } else {
          throw new Error(data.error || 'Connection failed');
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to connect Square account');
        toast.error('Failed to connect Square account');
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
            {status === 'processing' ? 'Connecting...' : status === 'success' ? 'Connected!' : 'Connection Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status !== 'processing' && (
            <Button 
              onClick={() => navigate('/studio')} 
              variant={status === 'success' ? 'default' : 'outline'}
            >
              {status === 'success' ? 'Go to Studio' : 'Back to Studio'}
            </Button>
          )}

          {status === 'error' && (
            <p className="text-xs text-muted-foreground">
              If this issue persists, please contact support.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SquareOAuthCallback;
