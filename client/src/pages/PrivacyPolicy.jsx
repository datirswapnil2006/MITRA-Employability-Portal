import { Link } from "react-router-dom";
import PublicFooter from "../components/PublicFooter";

const SECTIONS = [
  {
    title: "1. Information we collect",
    body: `When you register as a student, we collect your ERP number, name, email address,
gender, branch, year, and section. When you attempt a test, we collect your answers,
code submissions, and the resulting scores. Admin accounts are provisioned directly
by the placement cell and are not self-registered.`,
  },
  {
    title: "2. How we use your information",
    body: `Your information is used solely to operate the placement assessment process: verifying
your eligibility to register, administering tests, grading submissions, and generating
results and leaderboards for the placement cell's review. We do not use your data for
advertising and do not sell it to third parties.`,
  },
  {
    title: "3. Code execution",
    body: `Coding submissions are sent to a third-party code execution service to compile and run
your code against test cases. Only the code you submit and the test-case input are sent —
no other personal information is included in that request.`,
  },
  {
    title: "4. Data storage & security",
    body: `Passwords are hashed before storage and are never stored or transmitted in plain text.
Access to the platform is controlled via authenticated sessions, and administrative
actions are restricted to approved admin accounts.`,
  },
  {
    title: "5. Data retention",
    body: `Your registration details and test results are retained for as long as needed to support
the placement process at your institution. Contact the placement cell if you would like
your data reviewed or removed.`,
  },
  {
    title: "6. Your rights",
    body: `You may request access to, correction of, or deletion of your personal data by
contacting the placement cell administering this platform.`,
  },
  {
    title: "7. Changes to this policy",
    body: `This policy may be updated from time to time. Continued use of the platform after
changes are posted constitutes acceptance of the revised policy.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-desk px-6 md:px-16 py-5 flex items-center justify-between border-b border-white/10">
        <Link to="/" className="flex items-baseline gap-2.5">
          <span className="font-display font-bold text-xl text-on-desk">PRMITR Assess</span>
        </Link>
        <Link to="/" className="text-on-desk-soft hover:text-on-desk text-sm transition-colors">
          ← Back to home
        </Link>
      </header>

      <main className="flex-1 bg-surface text-ink px-6 md:px-16 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[11px] tracking-widest uppercase text-accent mb-3">Legal</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">Privacy Policy</h1>
          <p className="text-ink-soft text-sm mb-12">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-10">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="font-display text-lg font-semibold mb-2.5">{s.title}</h2>
                <p className="text-[14.5px] text-ink-soft leading-relaxed whitespace-pre-line">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
