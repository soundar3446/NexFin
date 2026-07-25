function TermsModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal-header">
          <h2>Terms &amp; Conditions and Privacy Notice</h2>
          <button type="button" className="terms-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="terms-modal-body">
          <p className="terms-disclaimer">
            NexFin is a hackathon prototype built on simulated Account Information Services (AIS)
            data. It is not a licensed financial institution and no real money movement takes
            place. This notice describes how the prototype handles the data it is given.
          </p>

          <h3>1. Acceptance of terms</h3>
          <p>
            By creating a session and continuing past this screen, you agree to let NexFin
            retrieve and store your account, balance, and transaction data for the sole purpose of
            showing you spending analysis and financial insights within this application.
          </p>

          <h3>2. Data we access and store</h3>
          <ul>
            <li>Account metadata — nickname, currency, account type</li>
            <li>Point-in-time balance snapshots, used to show trends over time</li>
            <li>Transaction line items — amount, currency, date, merchant, category</li>
          </ul>
          <p>
            We deliberately do not store full addresses, sort codes/account numbers, card
            instruments, or any other raw banking payload fields that this application doesn't
            actively use for analysis.
          </p>

          <h3>3. How your data is used</h3>
          <p>
            Your data is used only to power the dashboard, spending insights, and any AI-assisted
            features inside NexFin. It is never sold, shared with third parties, or used for
            marketing.
          </p>

          <h3>4. Your rights</h3>
          <p>
            You can withdraw this acknowledgement and request deletion of your stored data at any
            time from within the application. Under UK GDPR, you also have the right to access,
            correct, or export the data held about you.
          </p>

          <h3>5. Security</h3>
          <p>
            Credentials are verified against a dedicated identity provider and are never stored by
            NexFin. Stored data is limited to what's listed above and is retained only as long as
            needed for the analysis features it supports.
          </p>

          <h3>6. Changes</h3>
          <p>
            Because this is an actively developed prototype, this notice may change as features
            are added. Continuing to use the application after a change constitutes acceptance of
            the update.
          </p>
        </div>

        <div className="terms-modal-footer">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TermsModal
