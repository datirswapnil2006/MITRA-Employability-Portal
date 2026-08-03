import { Link } from "react-router-dom";
import PublicFooter from "../components/PublicFooter";

const SECTIONS = [
  {
    title: "1. Eligibility",
    body: `This platform is intended for use by enrolled students of the institution operating it,
identified by a valid ERP number, and by authorized placement-cell administrators. Student
accounts require approval before login access is granted.`,
  },
  {
    title: "2. Account responsibilities",
    body: `You are responsible for maintaining the confidentiality of your password and for all
activity that occurs under your account. Notify the placement cell immediately if you
suspect unauthorized access to your account.`,
  },
  {
    title: "3. Test conduct",
    body: `Each test may be attempted only once. You are expected to complete assessments
independently and without unauthorized assistance, reference material, or collaboration,
unless a specific test's instructions state otherwise. The placement cell reserves the
right to invalidate results where a violation of test conduct is identified.`,
  },
  {
    title: "4. Coding submissions",
    body: `Code you submit is executed in a sandboxed third-party environment solely to evaluate
your solution against provided test cases. Submissions should not include malicious,
harmful, or disruptive code directed at the execution environment or the platform.`,
  },
  {
    title: "5. Platform availability",
    body: `While we aim to keep the platform available and responsive during scheduled assessments,
we do not guarantee uninterrupted access and are not liable for loss of results due to
factors outside our control, including network issues or third-party service outages.`,
  },
  {
    title: "6. Acceptable use",
    body: `You agree not to attempt to disrupt the platform, access accounts or data that are not
your own, or use the platform for any purpose other than participating in the placement
assessment process.`,
  },
  {
    title: "7. Changes to these terms",
    body: `These terms may be updated from time to time. Continued use of the platform after
changes are posted constitutes acceptance of the revised terms.`,
  },
  {
    title: "8. Contact",
    body: `Questions about these terms should be directed to the placement cell administering
this platform at your institution.`,
  },
];

export default function TermsOfService() {
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
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">Terms of Service</h1>
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
