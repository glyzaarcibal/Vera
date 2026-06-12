import React, { useMemo, useState } from "react";
import feelingsChart from "../assets/images/Feelings Chart.jpg";
import {
  formatEmotionName,
  getDominantEmotionState,
} from "../utils/emotionHierarchy";
import "./EmotionScoreChart.css";

export default function EmotionScoreChart({ scores }) {
  const [showAll, setShowAll] = useState(false);
  const [showWheel, setShowWheel] = useState(false);

  const sortedScores = useMemo(
    () =>
      Object.entries(scores || {})
        .filter(([, score]) => Number.isFinite(score))
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA),
    [scores]
  );

  if (sortedScores.length === 0) return null;

  const dominant = getDominantEmotionState(scores);
  const visibleScores = showAll ? sortedScores : sortedScores.slice(0, 8);

  return (
    <div className="emotion-state-panel">
      {dominant && (
        <div
          className="dominant-emotion-card"
          data-primary={dominant.primary.toLowerCase()}
        >
          <span className="dominant-emotion-eyebrow">Current Emotion State</span>
          <strong className="dominant-emotion-primary">{dominant.primary}</strong>
          <div className="dominant-emotion-details">
            <span>
              <small>Secondary Emotion</small>
              {dominant.secondary}
            </span>
            <span>
              <small>Detected Emotion</small>
              {dominant.detected}
            </span>
            <span>
              <small>Confidence Score</small>
              {(dominant.score * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="hume-score-chart">
        <div className="hume-score-chart-header">
          <strong>Hume expression scores</strong>
          <span>{sortedScores.length} expressions</span>
        </div>

        <div className={`hume-score-bars ${showAll ? "show-all" : ""}`}>
          {visibleScores.map(([emotion, score]) => {
            const percent = Math.max(0, Math.min(100, score * 100));

            return (
              <div className="hume-score-row" key={emotion}>
                <span className="hume-score-label">{formatEmotionName(emotion)}</span>
                <div
                  className="hume-score-track"
                  role="progressbar"
                  aria-label={`${formatEmotionName(emotion)} expression score`}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={Math.round(percent)}
                >
                  <span
                    className="hume-score-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="hume-score-value">{percent.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>

        <div className="hume-score-actions">
          {sortedScores.length > 8 && (
            <button
              type="button"
              className="hume-score-toggle"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? "Show top 8" : `Show all ${sortedScores.length}`}
            </button>
          )}
          <button
            type="button"
            className="hume-score-toggle"
            onClick={() => setShowWheel((current) => !current)}
          >
            {showWheel ? "Hide Feelings Wheel" : "View Feelings Wheel"}
          </button>
        </div>

        {showWheel && (
          <img
            className="feelings-wheel-reference"
            src={feelingsChart}
            alt="Feelings Wheel hierarchy reference"
          />
        )}

        <small className="hume-score-note">
          The highest Hume expression determines the displayed Feelings Wheel
          category. Scores are model estimates, not verified accuracy.
        </small>
      </div>
    </div>
  );
}
