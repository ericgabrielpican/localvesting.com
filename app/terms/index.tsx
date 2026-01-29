export const metadata = { title: "Terms & Conditions | LocalVesting" };

export default function TermsPage() {
  return (
    <main style={styles.main}>
      <h1 style={styles.h1}>Terms & Conditions</h1>
      <p style={styles.muted}>Last updated: {new Date().toLocaleDateString()}</p>

      <h2 style={styles.h2}>1. Demo phase (no real-world money)</h2>
      <p style={styles.p}>
        LocalVesting is currently provided in a <b>demo/testing phase</b>. The platform is not operating with real-world money yet.
        Any features shown are for demonstration and product testing purposes.
      </p>

      <h2 style={styles.h2}>2. Platform role</h2>
      <p style={styles.p}>
        LocalVesting is a technology platform acting solely as an <b>intermediary</b> between users and listed businesses.
        LocalVesting is not a bank, investment firm, broker, or financial advisor, and does not provide investment advice.
      </p>

      <h2 style={styles.h2}>3. Eligibility</h2>
      <p style={styles.p}>You must be at least <b>18 years old</b> to use the platform.</p>

      <h2 style={styles.h2}>4. User obligations</h2>
      <ul style={styles.ul}>
        <li>Provide accurate information.</li>
        <li>Use the platform lawfully and respectfully.</li>
        <li>Do not attempt unauthorized access or abuse.</li>
      </ul>

      <h2 style={styles.h2}>5. No guarantee</h2>
      <p style={styles.p}>
        The platform does not guarantee outcomes, availability of listings, or any results from interactions with third parties.
      </p>

      <h2 style={styles.h2}>6. Limitation of liability</h2>
      <p style={styles.p}>
        To the maximum extent permitted by law, LocalVesting is not liable for indirect losses, lost profits, third-party actions,
        or technical interruptions.
      </p>

      <h2 style={styles.h2}>7. Suspension/termination</h2>
      <p style={styles.p}>
        Accounts may be suspended/terminated for fraud, abuse, or violations of these Terms.
      </p>

      <h2 style={styles.h2}>8. Contact</h2>
      <p style={styles.p}>
        For legal/privacy inquiries: <b>gdpr@localvesting.com</b>
      </p>

      <h2 style={styles.h2}>9. Governing law</h2>
      <p style={styles.p}>
        These Terms are governed by Romanian law and applicable EU law.
      </p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { maxWidth: 900, margin: "0 auto", padding: "32px 18px", lineHeight: 1.6 },
  h1: { fontSize: 34, marginBottom: 6 },
  h2: { fontSize: 20, marginTop: 22, marginBottom: 8 },
  p: { margin: "10px 0" },
  ul: { margin: "10px 0", paddingLeft: 20 },
  muted: { opacity: 0.7, marginTop: 0 },
};
