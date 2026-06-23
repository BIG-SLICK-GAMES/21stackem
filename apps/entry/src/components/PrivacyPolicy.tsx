import { useEffect } from "react";
import { ArrowLeft, Users } from "lucide-react";

interface CommunityRulesProps {
  onClose?: () => void;
  onBack?: () => void;
}

export default function CommunityRules({
  onClose,
  onBack,
}: CommunityRulesProps) {
  const handleClose = onClose || onBack || (() => {});

  // Scroll to 10% from top when component mounts
  useEffect(() => {
    const scrollPosition = window.innerHeight * 0.1;
    window.scrollTo({ top: scrollPosition, behavior: "smooth" });
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
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Community Guidelines
                </h1>
                <p className="text-sm text-gray-500">
                  Building a safe and respectful gaming community
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 md:p-8 text-gray-700 text-sm leading-relaxed max-h-[70vh] overflow-y-auto">
            <p className="mb-6">
              BigSlick Games is committed to providing a safe, welcoming, and
              enjoyable environment for all players. These Community Guidelines
              outline the standards of behavior expected from all members of our
              gaming community.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              1. Respect and Courtesy
            </h3>
            <p className="mb-2">
              All members of the BigSlick Games community are expected to treat
              each other with respect and courtesy.
            </p>
            <p className="mb-1 ml-4">
              1.1 Be respectful in all interactions with other players,
              regardless of skill level or experience
            </p>
            <p className="mb-1 ml-4">
              1.2 Use appropriate and considerate language in all communications
            </p>
            <p className="mb-1 ml-4">
              1.3 Respect different opinions, backgrounds, and perspectives
            </p>
            <p className="mb-1 ml-4">
              1.4 Avoid personal attacks, insults, or inflammatory remarks
            </p>
            <p className="mb-4 ml-4">
              1.5 Demonstrate good sportsmanship in both victory and defeat
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              2. Prohibited Conduct
            </h3>
            <p className="mb-2">
              The following behaviors are strictly prohibited and will result in
              immediate disciplinary action:
            </p>

            <p className="mb-2 ml-4">
              <strong>2.1 Harassment and Bullying:</strong>
            </p>
            <p className="mb-1 ml-8">
              • Intimidating, threatening, or targeting other users
            </p>
            <p className="mb-1 ml-8">
              • Persistent unwanted contact or attention
            </p>
            <p className="mb-1 ml-8">
              • Encouraging others to harass or target a specific user
            </p>
            <p className="mb-4 ml-8">
              • Creating a hostile or uncomfortable environment for others
            </p>

            <p className="mb-2 ml-4">
              <strong>2.2 Hate Speech and Discrimination:</strong>
            </p>
            <p className="mb-1 ml-8">
              • Language or content that promotes hatred or discrimination based
              on race, ethnicity, religion, gender, sexual orientation,
              disability, or any other protected characteristic
            </p>
            <p className="mb-1 ml-8">
              • Use of slurs, derogatory terms, or offensive stereotypes
            </p>
            <p className="mb-4 ml-8">
              • Symbols, images, or references associated with hate groups or
              ideologies
            </p>

            <p className="mb-2 ml-4">
              <strong>2.3 Profanity and Offensive Language:</strong>
            </p>
            <p className="mb-1 ml-8">
              • Use of profanity, curse words, or vulgar language
            </p>
            <p className="mb-1 ml-8">
              • Sexually explicit or suggestive language
            </p>
            <p className="mb-1 ml-8">
              • Obscene or offensive usernames, avatars, or profile content
            </p>
            <p className="mb-4 ml-8">
              • Attempts to bypass profanity filters through creative spelling
              or symbols
            </p>

            <p className="mb-2 ml-4">
              <strong>2.4 Inappropriate Content:</strong>
            </p>
            <p className="mb-1 ml-8">
              • Sexually explicit, pornographic, or suggestive content
            </p>
            <p className="mb-1 ml-8">• Violent, gory, or disturbing imagery</p>
            <p className="mb-1 ml-8">
              • Content promoting illegal activities or substance abuse
            </p>
            <p className="mb-4 ml-8">
              • Links to external sites containing inappropriate material
            </p>

            <p className="mb-2 ml-4">
              <strong>2.5 Spam and Disruptive Behavior:</strong>
            </p>
            <p className="mb-1 ml-8">
              • Flooding chat or forums with repetitive messages
            </p>
            <p className="mb-1 ml-8">
              • Posting irrelevant or off-topic content excessively
            </p>
            <p className="mb-1 ml-8">
              • Using all caps, excessive punctuation, or formatting to disrupt
              conversations
            </p>
            <p className="mb-4 ml-8">
              • Posting advertisements or promotional content without
              authorization
            </p>

            <p className="mb-2 ml-4">
              <strong>2.6 Cheating and Exploitation:</strong>
            </p>
            <p className="mb-1 ml-8">
              • Using third-party software, bots, or automated tools
            </p>
            <p className="mb-1 ml-8">
              • Exploiting bugs, glitches, or game mechanics for unfair
              advantage
            </p>
            <p className="mb-1 ml-8">
              • Account sharing or multi-accounting to circumvent rules
            </p>
            <p className="mb-4 ml-8">
              • Manipulating game systems or economies
            </p>

            <p className="mb-2 ml-4">
              <strong>2.7 Impersonation and Fraud:</strong>
            </p>
            <p className="mb-1 ml-8">
              • Impersonating staff members, moderators, or other players
            </p>
            <p className="mb-1 ml-8">
              • Creating misleading or deceptive accounts
            </p>
            <p className="mb-1 ml-8">
              • Attempting to scam or defraud other players
            </p>
            <p className="mb-4 ml-8">
              • Phishing attempts or requests for personal information
            </p>

            <p className="mb-2 ml-4">
              <strong>2.8 Privacy Violations:</strong>
            </p>
            <p className="mb-1 ml-8">
              • Sharing another person's private information without consent
              (doxxing)
            </p>
            <p className="mb-1 ml-8">
              • Posting screenshots of private conversations without permission
            </p>
            <p className="mb-1 ml-8">
              • Revealing personal details about other players
            </p>
            <p className="mb-4 ml-8">
              • Recording or sharing voice/video communications without consent
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              3. Positive Community Behavior
            </h3>
            <p className="mb-2">
              We encourage all players to contribute positively to our
              community:
            </p>
            <p className="mb-1 ml-4">3.1 Welcome and assist new players</p>
            <p className="mb-1 ml-4">
              3.2 Share knowledge, strategies, and tips constructively
            </p>
            <p className="mb-1 ml-4">
              3.3 Celebrate the achievements and successes of others
            </p>
            <p className="mb-1 ml-4">
              3.4 Provide constructive feedback respectfully
            </p>
            <p className="mb-1 ml-4">
              3.5 Report violations of community guidelines to help maintain a
              safe environment
            </p>
            <p className="mb-4 ml-4">
              3.6 Participate in community events and activities positively
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              4. Communication Standards
            </h3>
            <p className="mb-2">
              <strong>4.1 Chat and Forum Usage:</strong>
            </p>
            <p className="mb-1 ml-4">
              • Keep conversations relevant to the game and community
            </p>
            <p className="mb-1 ml-4">
              • Avoid discussing controversial topics such as politics or
              religion
            </p>
            <p className="mb-1 ml-4">
              • Do not share personal contact information publicly
            </p>
            <p className="mb-4 ml-4">
              • Use appropriate channels for different types of discussions
            </p>

            <p className="mb-2">
              <strong>4.2 Username and Profile Guidelines:</strong>
            </p>
            <p className="mb-1 ml-4">
              • Choose appropriate usernames that do not contain offensive
              language
            </p>
            <p className="mb-1 ml-4">
              • Avoid usernames that impersonate staff or other players
            </p>
            <p className="mb-1 ml-4">
              • Keep profile content and avatars family-friendly
            </p>
            <p className="mb-4 ml-4">
              • Do not use misleading or deceptive profile information
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              5. Enforcement and Consequences
            </h3>
            <p className="mb-2">
              Violations of these Community Guidelines will result in
              disciplinary action. The severity of consequences depends on the
              nature and frequency of violations:
            </p>

            <p className="mb-2 ml-4">
              <strong>5.1 Warning:</strong>
            </p>
            <p className="mb-4 ml-4">
              First-time minor violations may result in a formal warning with an
              explanation of the violation and expected behavior.
            </p>

            <p className="mb-2 ml-4">
              <strong>5.2 Temporary Suspension (30 Days):</strong>
            </p>
            <p className="mb-1 ml-8">• Account access suspended for 30 days</p>
            <p className="mb-1 ml-8">
              • Unable to access games, forums, chat, or any community features
            </p>
            <p className="mb-1 ml-8">
              • Virtual currency and progress remain intact but inaccessible
              during suspension
            </p>
            <p className="mb-1 ml-8">• Violation recorded in account history</p>
            <p className="mb-4 ml-8">
              • Email notification sent with detailed explanation of violation
            </p>

            <p className="mb-2 ml-4">
              <strong>5.3 Permanent Ban:</strong>
            </p>
            <p className="mb-1 ml-8">
              • Account permanently deleted with no possibility of recovery
            </p>
            <p className="mb-1 ml-8">
              • All game progress, virtual currency, and purchased items
              forfeited
            </p>
            <p className="mb-1 ml-8">
              • All achievements, statistics, and rankings removed
            </p>
            <p className="mb-1 ml-8">
              • IP address banned from creating new accounts
            </p>
            <p className="mb-1 ml-8">
              • No refunds provided for any purchases or virtual items
            </p>
            <p className="mb-4 ml-8">
              • May be reported to relevant authorities for illegal activities
            </p>

            <p className="mb-2 ml-4">
              <strong>5.4 Immediate Permanent Ban (No Warning):</strong>
            </p>
            <p className="mb-4 ml-4">
              Severe violations including but not limited to: illegal content,
              credible threats of violence, severe harassment, doxxing, child
              exploitation, or repeated violations after previous bans will
              result in immediate permanent account termination without prior
              warning.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              6. Reporting Violations
            </h3>
            <p className="mb-2">
              If you witness or experience behavior that violates these
              guidelines:
            </p>
            <p className="mb-1 ml-4">
              6.1 Use the in-game reporting feature when available
            </p>
            <p className="mb-1 ml-4">
              6.2 Contact our moderation team at bigslickgames@gmail.com
            </p>
            <p className="mb-1 ml-4">
              6.3 Provide specific details: username, date/time, description of
              violation, and screenshots if available
            </p>
            <p className="mb-1 ml-4">
              6.4 Do not engage with or retaliate against rule violators
            </p>
            <p className="mb-4 ml-4">
              6.5 Allow our moderation team to handle the situation
            </p>

            <p className="mb-4">
              <strong>Report Response Time:</strong> We aim to review and
              respond to all reports within 48 hours. Urgent safety concerns
              will be prioritized.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              7. Appeals Process
            </h3>
            <p className="mb-2">
              <strong>7.1 Suspension Appeals:</strong>
            </p>
            <p className="mb-4 ml-4">
              If you believe your suspension was issued in error, you may submit
              an appeal to bigslickgames@gmail.com within 7 days of the
              suspension. Include your account details, the reason you believe
              the suspension was incorrect, and any supporting evidence.
            </p>

            <p className="mb-2">
              <strong>7.2 Permanent Ban Appeals:</strong>
            </p>
            <p className="mb-4 ml-4">
              Permanent bans are final and are rarely overturned. Appeals will
              only be considered in cases of proven account compromise or clear
              system error. Submit appeals to bigslickgames@gmail.com with
              comprehensive evidence.
            </p>

            <p className="mb-2">
              <strong>7.3 Appeal Review:</strong>
            </p>
            <p className="mb-4 ml-4">
              All appeals are reviewed by senior moderation staff. Decisions on
              appeals are final and not subject to further review. Appeal
              decisions will be communicated within 5-7 business days.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              8. Staff and Moderator Conduct
            </h3>
            <p className="mb-2">
              Our staff and moderators are held to the highest standards:
            </p>
            <p className="mb-1 ml-4">
              8.1 Staff members will always act professionally and fairly
            </p>
            <p className="mb-1 ml-4">
              8.2 Moderators cannot show favoritism or bias in enforcement
            </p>
            <p className="mb-1 ml-4">
              8.3 Report concerns about staff conduct to bigslickgames@gmail.com
            </p>
            <p className="mb-4 ml-4">
              8.4 Staff will never ask for your password or sensitive personal
              information
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              9. Parental Guidance
            </h3>
            <p className="mb-4">
              While BigSlick Games is intended for players aged 18 and over, we
              encourage parents and guardians to monitor their children's online
              activities, educate them about online safety, and discuss
              appropriate online behavior.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              10. Updates to Guidelines
            </h3>
            <p className="mb-4">
              These Community Guidelines may be updated periodically to address
              new situations, improve clarity, or reflect changes in our
              services. Significant updates will be announced to the community.
              Continued use of BigSlick Games services constitutes acceptance of
              updated guidelines.
            </p>

            <h3 className="font-semibold text-gray-900 text-base mt-8 mb-3">
              11. Contact Information
            </h3>
            <p className="mb-2">
              For questions, concerns, or reports regarding community
              guidelines:
            </p>
            <p className="mb-1 ml-4">
              General Support: bigslickgames@gmail.com
            </p>
            <p className="mb-1 ml-4">
              Moderation Issues: bigslickgames@gmail.com
            </p>
            <p className="mb-1 ml-4">Response Time: Within 48 hours</p>

            <div className="mt-8 pt-6 border-t border-gray-200 bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-700 text-center">
                <strong>Remember:</strong> BigSlick Games is a community built
                on respect, fairness, and fun. By following these guidelines,
                you help create a positive gaming environment for everyone.
                Thank you for being part of our community!
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
