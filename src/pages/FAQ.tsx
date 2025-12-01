import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ArrowLeft, DollarSign, Download, CreditCard, Music, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function FAQ() {
  const navigate = useNavigate();

  const faqs = [
    {
      category: "Artist Payouts",
      icon: DollarSign,
      questions: [
        {
          q: "How do artists get paid on TDZ?",
          a: "TDZ pays artists $1 per stream on the TDZ platform. Every time someone streams your song, you earn a full dollar. No fractional payouts like traditional DSPs that pay $0.003-$0.005 per stream."
        },
        {
          q: "Where does TDZ get the money to pay artists $1 per stream?",
          a: "From the TDZ Revenue Pool — which consists of fan subscriptions, download purchases, ads, premium features, sponsorships, and live event revenue. This diversified revenue model allows us to pay artists fairly."
        },
        {
          q: "How fast are payouts processed?",
          a: "Payout cycles run monthly. Artists can withdraw once they reach the minimum threshold of $10. Payments are processed automatically to your connected payment method."
        },
        {
          q: "Can I see my earnings in real-time?",
          a: "Yes! Your Artist Dashboard shows real-time streaming counts, download sales, and total earnings. You can track every stream and every dollar as it comes in."
        }
      ]
    },
    {
      category: "Downloads & Sales",
      icon: Download,
      questions: [
        {
          q: "Can fans download music on TDZ?",
          a: "Yes! Artists set their own download price during upload. Fans can purchase and download tracks, and 100% of download revenue goes directly to the artist (minus standard payment processing fees of ~2.9%)."
        },
        {
          q: "How do I set a download price for my track?",
          a: "When uploading a track, you'll see an optional 'Download Price' field. Set any price you want (minimum $0.99). If left blank, the track will be streaming-only."
        },
        {
          q: "What happens when someone buys my download?",
          a: "The buyer gets a high-quality download of your track. You receive 100% of the sale price minus payment processing fees (~2.9%). Download revenue is tracked separately from streaming revenue in your dashboard."
        }
      ]
    },
    {
      category: "Subscription & Account",
      icon: CreditCard,
      questions: [
        {
          q: "Is a credit card required to sign up?",
          a: "Yes. TDZ requires an active subscription and a valid payment method for artists to distribute and monetize their music."
        },
        {
          q: "What does the subscription include?",
          a: "Your subscription gives you access to unlimited uploads, real-time analytics, the full Studio suite, AI-powered tools, and the ability to earn $1 per stream and 100% of download revenue."
        },
        {
          q: "Are there any hidden fees?",
          a: "No hidden fees. Your subscription covers all platform features. The only deduction from your earnings is standard payment processing fees (~2.9%) when you withdraw your earnings or when fans purchase downloads."
        }
      ]
    },
    {
      category: "AI Music",
      icon: Music,
      questions: [
        {
          q: "Does TDZ accept AI-generated music?",
          a: "Absolutely! TDZ welcomes AI-generated music, AI-assisted production, AI vocals, and hybrid human/AI projects. If you created it, you can distribute and monetize it on TDZ."
        },
        {
          q: "Do AI artists earn the same as human artists?",
          a: "Yes. AI artists earn the same $1 per stream and 100% of download revenue as human artists. We don't discriminate based on how music is created."
        },
        {
          q: "What about copyright for AI music?",
          a: "You must have the rights to distribute any music you upload. For AI-generated content, ensure you have the proper licenses and that your music doesn't infringe on existing copyrights."
        }
      ]
    },
    {
      category: "Platform & Distribution",
      icon: Zap,
      questions: [
        {
          q: "How long does it take for my music to go live?",
          a: "Your music goes live on TDZ within 24 hours of publishing. There's no waiting weeks for external platform distribution."
        },
        {
          q: "Can I update my music after it's published?",
          a: "Yes, you can update metadata, artwork, and even upload new versions. Changes reflect within 24-48 hours."
        },
        {
          q: "Is TDZ a DSP or a distributor?",
          a: "TDZ is a standalone streaming platform—like Spotify or Apple Music—but artist-owned. Artists upload directly to TDZ and keep 100% of their rights. We don't distribute to external platforms."
        }
      ]
    },
    {
      category: "For Fans",
      icon: Users,
      questions: [
        {
          q: "How does my subscription help artists?",
          a: "Your subscription goes directly into the TDZ Revenue Pool, which funds the $1 per stream payouts to artists. Every stream you make directly supports the artists you love."
        },
        {
          q: "Can I buy music to keep forever?",
          a: "Yes! Many artists offer their tracks for download at prices they set. When you purchase a download, you own that file forever—no subscription needed to keep listening."
        },
        {
          q: "What audio quality is available?",
          a: "TDZ supports standard streaming, HD Audio (24-bit/96kHz), Hi-Res Audio, and even Dolby Atmos. The quality depends on what the artist uploads."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-display font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Learn about our $1 per stream model, downloads, subscriptions, and more.
          </p>
        </div>

        {/* Key Highlights */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card className="glass-card border-green-500/30">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-500">$1.00</div>
              <div className="text-sm text-muted-foreground">Per Stream</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/30">
            <CardContent className="p-6 text-center">
              <Download className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Download Revenue</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-accent/30">
            <CardContent className="p-6 text-center">
              <Music className="w-8 h-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-accent">AI Welcome</div>
              <div className="text-sm text-muted-foreground">Same Earnings</div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqs.map((section, idx) => (
            <Card key={idx} className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span>{section.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((faq, qIdx) => (
                    <AccordionItem key={qIdx} value={`${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="glass-card mt-12 border-primary/30">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-3">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help you succeed.
            </p>
            <Button onClick={() => navigate("/support")} className="bg-gradient-to-r from-primary to-secondary">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}