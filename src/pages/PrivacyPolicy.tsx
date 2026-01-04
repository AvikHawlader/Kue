import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-white p-8 max-w-3xl mx-auto text-slate-800">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8">
          <ArrowLeft size={20} /> Back
        </button>
      )}
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Data Collection</h2>
          <p>We collect your email address for authentication. We process the text messages you input to generate AI replies. We do not sell your personal data.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">2. AI Processing</h2>
          <p>Your inputs are sent to third-party AI providers (like Groq/OpenAI) solely for the purpose of generating replies. They are not used to train public models.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">3. Contact</h2>
          <p>For privacy concerns, contact us at: <a href="mailto:avikhawlader2002@gmail.com" className="text-indigo-600">avikhawlader2002@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}