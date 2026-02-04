import { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:8000/api/monday-briefing';

function App() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateBriefing = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(API_URL);
      
      if (response.data.success) {
        setBriefing(response.data.data);
      } else {
        setError(response.data.message || 'Failed to generate briefing');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to connect to the Executive Twin API. Make sure the backend is running on port 8000.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Executive Twin</h1>
        <p>AI Chief of Staff for Dr. Arokia</p>
      </header>

      <div className="controls">
        <button 
          className="btn-primary" 
          onClick={generateBriefing}
          disabled={loading}
        >
          {loading ? 'Analyzing Your Outlook...' : 'Initialize Monday Briefing'}
        </button>
      </div>

      <div className="dashboard">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>The Executive Twin is analyzing your priorities...</p>
          </div>
        )}

        {error && (
          <div className="briefing-card error">
            <div className="error-title">⚠️ Error</div>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !briefing && (
          <div className="empty-state">
            <p>👆 Click "Initialize Monday Briefing" to start</p>
            <p style={{fontSize: '0.9rem', marginTop: '1rem'}}>
              Connects to your real Outlook and analyzes emails & calendar
            </p>
          </div>
        )}

        {briefing && (
          <div className="briefing-card">
            <div className="briefing-header">
              Good Morning, Dr. Arokia. Here is your Strategic Briefing:
            </div>

            <div className="priorities">
              {briefing.strategic_briefing?.map((item, index) => (
                <div 
                  key={index} 
                  className={`priority-item ${item.priority_rank === 0 ? 'crisis' : ''}`}
                >
                  <div className="priority-header">
                    <span className="priority-rank">
                      {item.emoji || '📌'} Priority #{item.priority_rank}
                    </span>
                    <span className={`goal-category ${item.priority_rank === 0 ? 'crisis' : ''}`}>
                      {item.goal_category}
                    </span>
                  </div>
                  
                  <div className="task-title">{item.task}</div>
                  
                  <div className="task-meta">
                    <span>⏱️ {item.time_estimate}</span>
                  </div>
                  
                  <div className="task-reasoning">
                    💡 {item.reasoning}
                  </div>
                </div>
              ))}
            </div>

            {briefing.noise_filtered && briefing.noise_filtered.length > 0 && (
              <div className="noise-section">
                <div className="noise-header">
                  🗑️ Noise Filtered (Auto-Archived):
                </div>
                <ul className="noise-list">
                  {briefing.noise_filtered.map((item, index) => (
                    <li key={index} className="noise-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
