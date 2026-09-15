import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function ProfileCookies() {
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
              Cookies
            </span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-[73px] pb-[100px] max-w-[402px] mx-auto w-full px-4 mt-4">
        <h1 className="font-lato font-bold text-lg text-black mb-2">
          BiteBook's Cookie Policy
        </h1>
        <p className="font-lato text-base text-black mb-6">Cookies</p>

        <div className="space-y-4 font-inter text-sm text-gray-700 leading-relaxed">
          <p>
            BiteBook uses cookies and similar technologies to enhance your
            experience when using our application.
          </p>
          <p>
            <strong className="text-black">1. What Are Cookies?</strong>
            <br />
            Cookies are small text files stored on your device that help us
            recognise you and remember your preferences. They allow us to
            improve the functionality and performance of the app.
          </p>
          <p>
            <strong className="text-black">2. Types of Cookies We Use</strong>
            <br />
            <strong>Essential cookies</strong> — required for the app to
            function properly, such as keeping you logged in.
            <br />
            <br />
            <strong>Analytics cookies</strong> — help us understand how you use
            the app so we can improve it.
            <br />
            <br />
            <strong>Preference cookies</strong> — remember your settings, such
            as language and theme preferences.
          </p>
          <p>
            <strong className="text-black">3. Managing Cookies</strong>
            <br />
            You can control cookie settings through your device's app settings.
            Please note that disabling certain cookies may affect the
            functionality of BiteBook.
          </p>
          <p>
            <strong className="text-black">4. Third-Party Cookies</strong>
            <br />
            We may use third-party services that set their own cookies to assist
            with analytics and app performance. These are subject to the
            respective providers' cookie policies.
          </p>
          <p>
            <strong className="text-black">5. Updates to This Policy</strong>
            <br />
            We may update this Cookie Policy from time to time. Continued use of
            the app constitutes acceptance of any changes.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
