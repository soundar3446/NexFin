function NoticeModal({ onAgree, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>How we use your data</h2>
        <p>
          NexFin reads your account, balance, and transaction data from your bank to show you
          spending analysis. This data is used only for that purpose, isn't shared with third
          parties, and you can ask us to delete it at any time.
        </p>
        <button onClick={onAgree} disabled={loading}>
          {loading ? 'Saving...' : 'I understand, continue'}
        </button>
      </div>
    </div>
  )
}

export default NoticeModal
