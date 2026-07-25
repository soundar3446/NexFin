function InsightNote({ insight, source }) {
  if (!insight) return null
  return (
    <p className="ai-insight-note">
      <span className={`ai-insight-badge ${source === 'ai' ? 'ai' : 'fallback'}`}>
        {source === 'ai' ? '✨ AI insight' : 'Summary'}
      </span>
      {insight}
    </p>
  )
}

export default InsightNote
