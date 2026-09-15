import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function ProfileTerms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-10 bg-white max-w-[402px] mx-auto w-full">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-black"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18l-6-6 6-6"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 12h18"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-lato font-bold text-xl text-black">
              Terms and Conditions
            </span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-[73px] pb-[100px] max-w-[402px] mx-auto w-full px-4 mt-4">
        <h1 className="font-lato font-bold text-lg text-black mb-2">
          BiteBook's Terms and Conditions of use
        </h1>
        <p className="font-lato text-base text-black mb-6">
          Terms and Conditions
        </p>

        <div className="space-y-4 font-inter text-sm text-gray-700 leading-relaxed">
          <p>
            Welcome to BiteBook. By using our application, you agree to be bound
            by the following terms and conditions. Please read them carefully
            before using the app.
          </p>
          <p>
            <strong className="text-black">1. Acceptance of Terms</strong>
            <br />
            By accessing or using BiteBook, you confirm that you are at least 13
            years of age and accept these Terms and Conditions in full.
          </p>
          <p>
            <strong className="text-black">2. Use of the App</strong>
            <br />
            BiteBook is a restaurant discovery and review platform. You agree to
            use the app only for lawful purposes and in a manner that does not
            infringe the rights of others.
          </p>
          <p>
            <strong className="text-black">3. User Content</strong>
            <br />
            You are responsible for the content you post, including reviews,
            photos, and comments. By submitting content, you grant BiteBook a
            non-exclusive, worldwide, royalty-free licence to use, reproduce,
            and display that content.
          </p>
          <p>
            <strong className="text-black">4. Prohibited Conduct</strong>
            <br />
            You agree not to post false or misleading reviews, spam, or any
            content that is offensive, defamatory, or violates applicable laws.
          </p>
          <p>
            <strong className="text-black">5. Intellectual Property</strong>
            <br />
            All content within the BiteBook application, including logos,
            designs, and code, is the property of BiteBook and is protected by
            applicable intellectual property laws.
          </p>
          <p>
            <strong className="text-black">6. Limitation of Liability</strong>
            <br />
            BiteBook is provided "as is" without warranties of any kind. We are
            not liable for any indirect, incidental, or consequential damages
            arising from your use of the app.
          </p>
          <p>
            <strong className="text-black">7. Changes to Terms</strong>
            <br />
            We reserve the right to update these terms at any time. Continued
            use of BiteBook after changes constitutes acceptance of the new
            terms.
          </p>
          <p>
            <strong className="text-black">8. Contact</strong>
            <br />
            If you have any questions about these terms, please contact us
            through the app's support channel.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
