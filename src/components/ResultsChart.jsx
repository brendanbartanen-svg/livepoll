import React from 'react'

const COLORS = [
  '#4361ee', '#3a0ca3', '#7209b7', '#f72585',
  '#4cc9f0', '#06d6a0', '#ffd166', '#ef476f',
  '#118ab2', '#073b4c',
]

export default function ResultsChart({ question, tallies, total }) {
  if (!question) return null

  const maxCount = Math.max(1, ...Object.values(tallies))

  return (
    <div style={{ marginTop: 12 }}>
      {question.options.map((opt, i) => {
        const count = tallies[opt] || 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const barWidth = total > 0 ? (count / maxCount) * 100 : 0

        return (
          <div key={opt} className="result-bar-container">
            <div className="result-bar-label">
              <span>{opt}</span>
              <span style={{ fontWeight: 600 }}>
                {count} ({pct}%)
              </span>
            </div>
            <div className="result-bar-track">
              <div
                className="result-bar-fill"
                style={{
                  width: `${barWidth}%`,
                  background: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
