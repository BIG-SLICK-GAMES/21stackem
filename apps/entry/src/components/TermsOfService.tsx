import { ArrowLeft, FileText } from "lucide-react";
import { useEffect } from "react";

interface TermsOfServiceProps {
  onClose?: () => void;
  onBack?: () => void;
}

export default function TermsOfService({
  onClose,
  onBack,
}: TermsOfServiceProps) {
  const handleClose = onClose || onBack || (() => {});

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={handleClose}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Terms of Service
                </h1>
                <p className="text-sm text-gray-500">
                  Last updated: October 7, 2025
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 md:p-8 text-gray-700 text-sm leading-relaxed max-h-[70vh] overflow-y-auto">
            <p className="mb-6">
              These Terms of Service ("Terms") govern your access to and use of
              BigSlick Games' gaming platform and services. By accessing or
              using our services, you agree to be bound by these Terms.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              1. Acceptance of Terms
            </h3>
            <p className="mb-2">
              By creating an account, accessing, or using BigSlick Games
              services, you agree to these Terms and our Privacy Policy. If you
              do not agree to these Terms, you may not access or use our
              services.
            </p>
            <p className="mb-1 ml-4">
              1.1 You must be at least 18 years of age to use our services
            </p>
            <p className="mb-1 ml-4">
              1.2 You represent that all information provided during
              registration is accurate and complete
            </p>
            <p className="mb-1 ml-4">
              1.3 You agree to comply with all applicable laws and regulations
            </p>
            <p className="mb-4 ml-4">
              1.4 These Terms constitute a legally binding agreement between you
              and BigSlick Games
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              2. Account Registration and Security
            </h3>
            <p className="mb-2">
              <strong>2.1 Account Creation:</strong>
            </p>
            <p className="mb-1 ml-4">
              • You must provide accurate, current, and complete information
              during registration
            </p>
            <p className="mb-1 ml-4">
              • You must maintain and promptly update your account information
            </p>
            <p className="mb-1 ml-4">
              • You may not create multiple accounts or share accounts
            </p>
            <p className="mb-4 ml-4">
              • Creating an account using false information may result in
              immediate termination
            </p>

            <p className="mb-2">
              <strong>2.2 Account Security:</strong>
            </p>
            <p className="mb-1 ml-4">
              • You are responsible for maintaining the confidentiality of your
              password and account
            </p>
            <p className="mb-1 ml-4">
              • You are fully responsible for all activities that occur under
              your account
            </p>
            <p className="mb-1 ml-4">
              • You must immediately notify us of any unauthorized use of your
              account
            </p>
            <p className="mb-4 ml-4">
              • We are not liable for any loss or damage arising from your
              failure to maintain account security
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              3. User Conduct and Prohibited Activities
            </h3>
            <p className="mb-2">
              You agree not to engage in any of the following prohibited
              activities:
            </p>
            <p className="mb-1 ml-4">
              3.1 Using the services for any illegal purpose or in violation of
              any laws
            </p>
            <p className="mb-1 ml-4">
              3.2 Harassing, threatening, intimidating, or bullying other users
            </p>
            <p className="mb-1 ml-4">
              3.3 Using offensive, abusive, defamatory, or hate speech language
            </p>
            <p className="mb-1 ml-4">
              3.4 Posting or transmitting sexually explicit, violent, or
              otherwise inappropriate content
            </p>
            <p className="mb-1 ml-4">
              3.5 Attempting to gain unauthorized access to our systems or other
              users' accounts
            </p>
            <p className="mb-1 ml-4">
              3.6 Using bots, scripts, or automated tools to access or interact
              with the services
            </p>
            <p className="mb-1 ml-4">
              3.7 Cheating, exploiting bugs, or using unauthorized third-party
              software
            </p>
            <p className="mb-1 ml-4">
              3.8 Impersonating any person or entity, or falsely stating an
              affiliation
            </p>
            <p className="mb-1 ml-4">
              3.9 Spamming, phishing, or engaging in fraudulent activities
            </p>
            <p className="mb-4 ml-4">
              3.10 Interfering with or disrupting the services or servers
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              4. Virtual Currency and Purchases
            </h3>
            <p className="mb-2">
              <strong>4.1 Virtual Currency:</strong>
            </p>
            <p className="mb-1 ml-4">
              • Virtual currency (chips, points, tokens) has no monetary value
              and cannot be exchanged for real money
            </p>
            <p className="mb-1 ml-4">
              • Virtual currency is for entertainment purposes only
            </p>
            <p className="mb-1 ml-4">
              • We reserve the right to modify, manage, or eliminate virtual
              currency at any time
            </p>
            <p className="mb-4 ml-4">
              • Virtual currency balances do not constitute personal property
            </p>

            <p className="mb-2">
              <strong>4.2 Purchases:</strong>
            </p>
            <p className="mb-1 ml-4">
              • All purchases of virtual currency or items are final and
              non-refundable
            </p>
            <p className="mb-1 ml-4">
              • Purchased items are licensed, not sold, and may not be
              transferred or resold
            </p>
            <p className="mb-1 ml-4">
              • Prices are subject to change without notice
            </p>
            <p className="mb-1 ml-4">
              • You are responsible for all charges associated with your payment
              method
            </p>
            <p className="mb-4 ml-4">
              • Account termination results in forfeiture of all purchased
              virtual items and currency
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              5. Intellectual Property Rights
            </h3>
            <p className="mb-2">
              All content, features, and functionality on BigSlick Games,
              including but not limited to text, graphics, logos, icons, images,
              audio, video, software, and game mechanics, are the exclusive
              property of BigSlick Games and are protected by copyright,
              trademark, patent, and other intellectual property laws.
            </p>
            <p className="mb-1 ml-4">
              5.1 You may not copy, modify, distribute, sell, or lease any part
              of our services
            </p>
            <p className="mb-1 ml-4">
              5.2 You may not reverse engineer, decompile, or attempt to extract
              source code
            </p>
            <p className="mb-1 ml-4">
              5.3 You may not create derivative works based on our services
            </p>
            <p className="mb-4 ml-4">
              5.4 Limited license granted for personal, non-commercial use only
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              6. User-Generated Content
            </h3>
            <p className="mb-2">
              <strong>6.1 Content Ownership:</strong>
            </p>
            <p className="mb-4 ml-4">
              You retain ownership of content you create and submit. However, by
              submitting content, you grant BigSlick Games a worldwide,
              non-exclusive, royalty-free, perpetual, irrevocable license to
              use, reproduce, modify, adapt, publish, translate, distribute, and
              display such content.
            </p>

            <p className="mb-2">
              <strong>6.2 Content Responsibilities:</strong>
            </p>
            <p className="mb-1 ml-4">
              • You are solely responsible for your content
            </p>
            <p className="mb-1 ml-4">
              • You represent that your content does not violate any third-party
              rights
            </p>
            <p className="mb-1 ml-4">
              • We may remove any content that violates these Terms
            </p>
            <p className="mb-4 ml-4">
              • We reserve the right to monitor and review user-generated
              content
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              7. Enforcement and Penalties
            </h3>
            <p className="mb-2">
              <strong>7.1 Violations:</strong>
            </p>
            <p className="mb-4 ml-4">
              We reserve the right to investigate and take appropriate action
              against anyone who violates these Terms, including warning,
              temporary suspension, or permanent termination of account access.
            </p>

            <p className="mb-2">
              <strong>7.2 Suspension Policy:</strong>
            </p>
            <p className="mb-1 ml-4">
              • First violation: Account suspension for 30 days
            </p>
            <p className="mb-1 ml-4">
              • Second violation: Permanent account termination
            </p>
            <p className="mb-1 ml-4">
              • Severe violations may result in immediate permanent ban
            </p>
            <p className="mb-4 ml-4">
              • No refunds for suspended or terminated accounts
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              8. Disclaimers and Limitation of Liability
            </h3>
            <p className="mb-2">
              <strong>8.1 Service Provided "As Is":</strong>
            </p>
            <p className="mb-4 ml-4">
              BigSlick Games is provided on an "as is" and "as available" basis
              without warranties of any kind, either express or implied,
              including but not limited to warranties of merchantability,
              fitness for a particular purpose, or non-infringement.
            </p>

            <p className="mb-2">
              <strong>8.2 No Guarantee of Availability:</strong>
            </p>
            <p className="mb-4 ml-4">
              We do not guarantee that the services will be uninterrupted,
              secure, or error-free. We may modify, suspend, or discontinue any
              aspect of the services at any time without notice.
            </p>

            <p className="mb-2">
              <strong>8.3 Limitation of Liability:</strong>
            </p>
            <p className="mb-1 ml-4">
              To the maximum extent permitted by law, BigSlick Games shall not
              be liable for:
            </p>
            <p className="mb-1 ml-4">
              • Any indirect, incidental, special, consequential, or punitive
              damages
            </p>
            <p className="mb-1 ml-4">
              • Loss of profits, revenue, data, or business opportunities
            </p>
            <p className="mb-1 ml-4">
              • Damages arising from your use or inability to use the services
            </p>
            <p className="mb-4 ml-4">
              • Any actions or content of third parties
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              9. Indemnification
            </h3>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless BigSlick Games,
              its officers, directors, employees, and agents from and against
              any claims, liabilities, damages, losses, and expenses, including
              reasonable attorneys' fees, arising out of or in any way connected
              with your access to or use of the services, your violation of
              these Terms, or your violation of any third-party rights.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              10. Dispute Resolution
            </h3>
            <p className="mb-2">
              <strong>10.1 Informal Resolution:</strong>
            </p>
            <p className="mb-4 ml-4">
              In the event of any dispute, you agree to contact us first at
              bigslickgames@gmail.com to attempt to resolve the dispute
              informally.
            </p>

            <p className="mb-2">
              <strong>10.2 Governing Law:</strong>
            </p>
            <p className="mb-4 ml-4">
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which BigSlick Games operates,
              without regard to conflict of law provisions.
            </p>

            <p className="mb-2">
              <strong>10.3 Arbitration:</strong>
            </p>
            <p className="mb-4 ml-4">
              Any dispute that cannot be resolved informally shall be resolved
              through binding arbitration in accordance with applicable
              arbitration rules, rather than in court.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              11. Modifications to Terms
            </h3>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will
              provide notice of material changes by posting the updated Terms on
              our platform and updating the "Last updated" date. Your continued
              use of the services after such modifications constitutes your
              acceptance of the updated Terms.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              12. Termination
            </h3>
            <p className="mb-2">
              <strong>12.1 Termination by You:</strong>
            </p>
            <p className="mb-4 ml-4">
              You may terminate your account at any time by contacting us at
              bigslickgames@gmail.com. Termination does not entitle you to any
              refunds.
            </p>

            <p className="mb-2">
              <strong>12.2 Termination by Us:</strong>
            </p>
            <p className="mb-1 ml-4">
              We may terminate or suspend your account immediately, without
              prior notice or liability, for any reason, including:
            </p>
            <p className="mb-1 ml-4">• Breach of these Terms</p>
            <p className="mb-1 ml-4">• Fraudulent or illegal activity</p>
            <p className="mb-1 ml-4">• Prolonged inactivity</p>
            <p className="mb-4 ml-4">
              • At our sole discretion for any operational reason
            </p>

            <p className="mb-2">
              <strong>12.3 Effect of Termination:</strong>
            </p>
            <p className="mb-1 ml-4">Upon termination:</p>
            <p className="mb-1 ml-4">
              • Your right to access and use the services will immediately cease
            </p>
            <p className="mb-1 ml-4">
              • All virtual currency and items will be forfeited
            </p>
            <p className="mb-1 ml-4">
              • We may delete your account data and content
            </p>
            <p className="mb-4 ml-4">
              • Provisions that should survive termination will remain in effect
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              13. Miscellaneous
            </h3>
            <p className="mb-2">
              <strong>13.1 Entire Agreement:</strong>
            </p>
            <p className="mb-4 ml-4">
              These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and BigSlick Games regarding the
              services.
            </p>

            <p className="mb-2">
              <strong>13.2 Severability:</strong>
            </p>
            <p className="mb-4 ml-4">
              If any provision of these Terms is found to be invalid or
              unenforceable, the remaining provisions will remain in full force
              and effect.
            </p>

            <p className="mb-2">
              <strong>13.3 Waiver:</strong>
            </p>
            <p className="mb-4 ml-4">
              Our failure to enforce any right or provision of these Terms will
              not be considered a waiver of those rights.
            </p>

            <p className="mb-2">
              <strong>13.4 Assignment:</strong>
            </p>
            <p className="mb-4 ml-4">
              You may not assign or transfer these Terms without our written
              consent. We may assign these Terms without restriction.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              14. Contact Information
            </h3>
            <p className="mb-2">
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <p className="mb-1 ml-4">Email: bigslickgames@gmail.com</p>
            <p className="mb-1 ml-4">Response Time: Within 48 hours</p>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                By using BigSlick Games, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <button
              onClick={handleClose}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-all shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
