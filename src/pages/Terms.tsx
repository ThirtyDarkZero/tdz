import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

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
            <FileText className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-display font-bold">Terms & Conditions</h1>
          </div>
          <Badge variant="secondary" className="mb-4">Last Updated: December 2024</Badge>
          <p className="text-lg text-muted-foreground">
            Please read these terms carefully before using TDZ Distribution.
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using TDZ Distribution ("TDZ", "we", "our", or "the Platform"), you agree to be bound by these Terms and Conditions. 
                  TDZ is a standalone streaming platform and music distribution service. If you disagree with any part of these terms, you may not access the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Platform Description</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  TDZ Distribution is an independent, artist-first streaming platform. Key features include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Direct streaming on TDZ platform (not distributed to external DSPs)</li>
                  <li>Industry-leading $1.00 per stream artist payout</li>
                  <li>Support for AI-generated and AI-assisted music alongside human artists</li>
                  <li>Social features including fan profiles, playlists, and community engagement</li>
                  <li>High-fidelity audio support including HD Audio, Dolby Atmos, and Hi-Res formats</li>
                  <li>Motion covers and visual content capabilities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. User Accounts & Subscription</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  When you create an account with us:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Subscription is required to access full platform features</li>
                  <li>Credit card is required for signup and payouts</li>
                  <li>You must provide accurate, complete, and current information</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must notify us immediately of any unauthorized access</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  <strong>Subscription Tiers:</strong> TDZ offers Starter ($9.99/month), Pro ($19.99/month), and Enterprise ($49.99/month) plans with varying features and capabilities.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Content Rights and Ownership</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You retain all rights to the content you upload. By uploading content, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>You own or have the necessary rights to the content</li>
                  <li>The content does not infringe on any third party's rights</li>
                  <li>You grant TDZ a license to stream and display your content on the platform</li>
                  <li>You will not upload content that violates any laws or regulations</li>
                  <li>AI-generated content must comply with all applicable AI content regulations</li>
                  <li>Maximum upload file size is 500MB per track</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Artist Earnings & Payouts</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  TDZ offers an industry-leading artist compensation model:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Streaming Revenue:</strong> Artists earn $1.00 per qualified stream</li>
                  <li>Streams count when fully played (30-second minimum threshold)</li>
                  <li><strong>Download Revenue:</strong> Artists retain 100% of download sales (minus standard transaction fees)</li>
                  <li>Artists set their own download prices during upload</li>
                  <li>Minimum payout threshold is $10</li>
                  <li>Payout cycles run monthly or on-demand when threshold is met</li>
                  <li>Payment processing may take 2-3 months due to verification processes</li>
                  <li>You are responsible for applicable taxes on your earnings</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Revenue Pool</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Artist payouts are funded by the TDZ Revenue Pool, which consists of: subscription revenue, advertising revenue, 
                  sponsorships, premium features, fan purchases, download revenue, and live event revenue. TDZ reserves the right 
                  to adjust payout rates with 30 days notice if necessary to maintain platform sustainability.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Social Features & Community Guidelines</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  TDZ includes social features for community engagement. By using these features, you agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Respect other users and their content</li>
                  <li>Not engage in harassment, spam, or abusive behavior</li>
                  <li>Not post misleading, false, or harmful content</li>
                  <li>Follow community moderation guidelines</li>
                  <li>Report inappropriate content or behavior</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Social features include: fan profiles, playlists, comments, reactions, follows, shares, and motion covers. 
                  TDZ reserves the right to moderate, remove, or restrict content that violates these guidelines.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Fan/Listener Terms</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  As a listener on TDZ:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Non-subscribers can preview tracks for 30 seconds before subscription is required</li>
                  <li>Subscribers receive unlimited streaming access</li>
                  <li>You may create and share playlists, follow artists, and engage with the community</li>
                  <li>Downloaded content is for personal use only and may not be redistributed</li>
                  <li>You may not manipulate stream counts or engage in fraudulent listening activity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Prohibited Uses</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You may not use our service to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Upload content you do not have rights to distribute</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Distribute illegal, harmful, or offensive content</li>
                  <li>Manipulate streaming numbers or engage in fraudulent activity</li>
                  <li>Use bots or automated systems to artificially inflate metrics</li>
                  <li>Harass, threaten, or abuse other users</li>
                  <li>Circumvent platform security or access restrictions</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. AI-Generated Content</h2>
                <p className="text-muted-foreground leading-relaxed">
                  TDZ welcomes AI-generated and AI-assisted music equally with human-created content. Artists using AI tools 
                  must ensure they have proper rights to use such tools and that the resulting content does not infringe on 
                  any third-party rights. AI-generated content is subject to the same quality standards and community guidelines 
                  as all other content on the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may terminate or suspend your account immediately, without prior notice, for any breach of 
                  these Terms. Upon termination, your right to use the service will immediately cease. Any pending 
                  earnings above the minimum threshold will be paid out within 60 days of termination, subject to 
                  fraud verification.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                  resulting from your use of or inability to use the service, including but not limited to loss of 
                  revenue, loss of data, loss of business opportunities, or any damages related to streaming metrics 
                  or payout calculations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes by 
                  updating the "Last Updated" date and, for significant changes, via email notification. Your continued 
                  use of the service after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms, please contact us at info@thirtydarkzero.com
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
