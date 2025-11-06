import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function FAQ() {
  const navigate = useNavigate();

  const faqs = [
    {
      category: "Distribution",
      questions: [
        {
          q: "How long does it take to get my music on streaming platforms?",
          a: "Your music typically goes live within 24 hours on most major platforms. Some platforms may take up to 48 hours depending on their review process."
        },
        {
          q: "Which platforms do you distribute to?",
          a: "We distribute to 150+ platforms including Spotify, Apple Music, Amazon Music, YouTube Music, Tidal, Deezer, and many more."
        },
        {
          q: "Can I update my music after it's published?",
          a: "Yes, you can update metadata, artwork, and even upload new versions. Changes typically reflect within 24-48 hours across platforms."
        }
      ]
    },
    {
      category: "Royalties & Payments",
      questions: [
        {
          q: "How much do I keep from streaming royalties?",
          a: "You keep 100% of your royalties. We don't take any commission from your earnings."
        },
        {
          q: "When do I get paid?",
          a: "Royalties are calculated monthly and paid out according to each platform's payment schedule, typically 2-3 months after the streaming period."
        },
        {
          q: "Is there a minimum payout threshold?",
          a: "The minimum payout threshold is $10. Once you reach this amount, payments are processed automatically."
        }
      ]
    },
    {
      category: "Audio Quality",
      questions: [
        {
          q: "Do you support Dolby Atmos and HD Audio?",
          a: "Yes! We fully support Dolby Atmos, Hi-Res Audio, and HD formats. Upload your high-quality masters and we'll deliver them to platforms that support these formats."
        },
        {
          q: "What audio format should I upload?",
          a: "We recommend WAV or FLAC files at 44.1kHz/16-bit or higher. For Dolby Atmos, upload ADM BWF files."
        },
        {
          q: "What's the maximum file size?",
          a: "You can upload files up to 500MB per track to accommodate HD and Dolby Atmos formats."
        }
      ]
    },
    {
      category: "Account & Features",
      questions: [
        {
          q: "Do I need a record label to use your service?",
          a: "No! We're designed for independent artists. You maintain full control and ownership of your music."
        },
        {
          q: "Can I distribute music for multiple artists?",
          a: "Yes, managers and labels can manage multiple artist accounts from a single dashboard."
        },
        {
          q: "Do you provide ISRC and UPC codes?",
          a: "Yes, we automatically generate ISRC codes for tracks and UPC codes for releases at no extra cost."
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
            Find answers to common questions about distribution, royalties, and features.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqs.map((section, idx) => (
            <Card key={idx} className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">{section.category}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((faq, qIdx) => (
                    <AccordionItem key={qIdx} value={`${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
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
        <Card className="glass-card mt-12">
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
