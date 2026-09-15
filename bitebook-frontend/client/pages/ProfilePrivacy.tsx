import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function ProfilePrivacy() {
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
              Privacy Policy
            </span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-[73px] pb-[100px] max-w-[402px] mx-auto w-full px-4 mt-4">
        <h1 className="font-lato font-bold text-lg text-black mb-2">
          BiteBook's Privacy Policy
        </h1>
        <p className="font-lato text-base text-black mb-6">Privacy Policy</p>

        <div className="space-y-4 font-inter text-sm text-gray-700 leading-relaxed">
          <p>
            At BiteBook, we are committed to protecting your personal
            information. This Privacy Policy explains how we collect, use, and
            share data when you use our app.
          </p>
          <p>
            <strong className="text-black">1. Information We Collect</strong>
            <br />
            We collect information you provide when creating an account (name,
            email, password), as well as content you submit such as reviews and
            photos. We also collect usage data and device information to improve
            the app.
          </p>
          <p>
            <strong className="text-black">2. How We Use Your Data</strong>
            <br />
            We use your data to provide and improve the BiteBook service,
            personalise your experience, send you relevant notifications, and
            respond to support requests.
          </p>
          <p>
            <strong className="text-black">3. Sharing Your Information</strong>
            <br />
            We do not sell your personal information. We may share data with
            trusted service providers who assist us in operating the app,
            subject to confidentiality obligations.
          </p>
          <p>
            <strong className="text-black">4. Data Retention</strong>
            <br />
            We retain your data for as long as your account is active or as
            needed to provide services. You may request deletion of your account
            and associated data at any time.
          </p>
          <p>
            <strong className="text-black">5. Security</strong>
            <br />
            We implement appropriate technical and organisational measures to
            protect your data against unauthorised access, loss, or misuse.
          </p>
          <p>
            <strong className="text-black">6. Your Rights</strong>
            <br />
            Depending on your location, you may have rights to access, correct,
            or delete your personal data. Contact us to exercise these rights.
          </p>
          <p>
            <strong className="text-black">7. Contact Us</strong>
            <br />
            If you have questions about our privacy practices, please reach out
            via the support channel in the app.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
