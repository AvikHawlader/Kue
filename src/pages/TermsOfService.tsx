import { ArrowLeft } from 'lucide-react';

export default function TermsOfService({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-white p-8 max-w-3xl mx-auto text-slate-800">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8">
          <ArrowLeft size={20} /> Back
        </button>
      )}
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Usage</h2>
          <p>Kue is an AI tool for generating text suggestions. You agree not to use it for harassment, hate speech, or illegal activities.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">2. Refunds</h2>
          <p>Since we offer a free tier to test the service, payments for the Pro plan are generally non-refundable once credits have been used.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">3. Liability</h2>
          <p>We are not responsible for the outcomes of your conversations. Use the AI suggestions at your own discretion.</p>
        </section>
      </div>
    </div>
  );
}