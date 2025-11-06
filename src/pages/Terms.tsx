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
          <Badge variant="secondary" className="mb-4">Last Updated: January 2025</Badge>
          <p className="text-lg text-muted-foreground">
            Please read these terms carefully before using our service.
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using TDZ Distribution, you agree to be bound by these Terms and Conditions. 
                  If you disagree with any part of these terms, you may not access the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  When you create an account with us, you must provide information that is accurate, complete, 
                  and current at all times. You are responsible for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Content Rights and Ownership</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You retain all rights to the content you upload. By uploading content, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>You own or have the necessary rights to the content</li>
                  <li>The content does not infringe on any third party's rights</li>
                  <li>You grant us a license to distribute your content to streaming platforms</li>
                  <li>You will not upload content that violates any laws or regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Distribution Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We provide distribution services to deliver your music to streaming platforms. We do not guarantee 
                  acceptance by any specific platform, as each platform has its own review process and content policies. 
                  You acknowledge that distribution timelines may vary by platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Royalties and Payments</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You retain 100% of royalties earned from streaming platforms. Payment terms:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Royalties are calculated monthly based on platform reports</li>
                  <li>Minimum payout threshold is $10</li>
                  <li>Payment processing may take 2-3 months due to platform reporting schedules</li>
                  <li>You are responsible for applicable taxes on your earnings</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Prohibited Uses</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You may not use our service to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Upload content you do not have rights to distribute</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Distribute illegal, harmful, or offensive content</li>
                  <li>Manipulate streaming numbers or engage in fraudulent activity</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may terminate or suspend your account immediately, without prior notice, for any breach of 
                  these Terms. Upon termination, your right to use the service will immediately cease, though 
                  content already distributed may remain on platforms subject to their policies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                  resulting from your use of or inability to use the service, including but not limited to loss of 
                  revenue, loss of data, or loss of business opportunities.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of any changes by 
                  updating the "Last Updated" date. Your continued use of the service after changes constitutes 
                  acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
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
