import { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);

  const [selectedGame, setSelectedGame] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchMode, setSearchMode] = useState("dropdown"); // "dropdown" or "text"

  const [selectedGenre, setSelectedGenre] = useState("All");
  const [maxPrice, setMaxPrice] = useState(80);
  const [topN, setTopN] = useState(5);

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [resultsLabel, setResultsLabel] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [wakingUp, setWakingUp] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const wakeTimerRef = useRef(null);
  const slowRequestTimerRef = useRef(null);

  // This effect already runs once when the page loads.
  // It doubles as a "pre-warm" call to Render — by the time the
  // user picks something, the server has had a head start waking up.
  useEffect(() => {
    fetch(`${API_BASE}/games`)
      .then((res) => res.json())
      .then((data) => setGames(data.games))
      .catch(console.error);

    fetch(`${API_BASE}/genres`)
      .then((res) => res.json())
      .then((data) => setGenres(data.genres))
      .catch(console.error);
  }, []);

  const startSlowRequestWatcher = () => {
    slowRequestTimerRef.current = setTimeout(() => {
      setWakingUp(true);
      setWaitSeconds(0);
      wakeTimerRef.current = setInterval(() => {
        setWaitSeconds((s) => s + 1);
      }, 1000);
    }, 2500);
  };

  const stopSlowRequestWatcher = () => {
    clearTimeout(slowRequestTimerRef.current);
    clearInterval(wakeTimerRef.current);
    setWakingUp(false);
    setWaitSeconds(0);
  };

  // ---- Mode 1: pick an exact game from the dropdown ----
  const fetchRecommendations = async () => {
    if (!selectedGame) return;

    setLoading(true);
    startSlowRequestWatcher();

    try {
      const url =
        `${API_BASE}/recommend?game=${encodeURIComponent(selectedGame)}` +
        `&top_n=${topN}` +
        `&max_price=${maxPrice}` +
        `&genre=${selectedGenre}`;

      const res = await fetch(url);
      const data = await res.json();

      setRecommendations(data.recommendations);
      setResultsLabel(`Because you liked ${selectedGame}`);
    } catch (err) {
      console.error(err);
    }

    stopSlowRequestWatcher();
    setLoading(false);
  };

  // ---- Mode 2: type any free description ----
  const fetchByText = async () => {
    if (!searchText.trim()) return;

    setLoading(true);
    startSlowRequestWatcher();

    try {
      const url =
        `${API_BASE}/search?query=${encodeURIComponent(searchText)}` +
        `&top_n=${topN}` +
        `&max_price=${maxPrice}` +
        `&genre=${selectedGenre}`;

      const res = await fetch(url);
      const data = await res.json();

      setRecommendations(data.recommendations);
      setResultsLabel(`Matches for "${searchText}"`);
    } catch (err) {
      console.error(err);
    }

    stopSlowRequestWatcher();
    setLoading(false);
  };

  const fetchGameDetail = async (appId) => {
    try {
      const res = await fetch(`${API_BASE}/game/${appId}`);
      const data = await res.json();
      setSelectedDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app">

      <div className="hero">
        <div className="hero-overlay">
          <h1>Discover Your Next Favorite Game</h1>
          <p>
            AI-powered recommendations using Steam metadata,
            embeddings and similarity matching.
          </p>
        </div>
      </div>

      <div className="layout">

        <aside className="sidebar">
          <h2>Filters</h2>

          <label>Genre</label>
          <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
            <option value="All">All</option>
            {genres.map((genre) => (
              <option key={genre}>{genre}</option>
            ))}
          </select>

          <label>Maximum Price (€)</label>
          <input type="range" min="0" max="80" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          <div className="value">€{maxPrice}</div>

          <label>Recommendations</label>
          <input type="range" min="3" max="10" value={topN} onChange={(e) => setTopN(e.target.value)} />
          <div className="value">{topN}</div>
        </aside>

        <main>

          {/* Mode toggle — like radio buttons, switches the search box below */}
          <div className="mode-toggle">
            <button
              className={searchMode === "dropdown" ? "active" : ""}
              onClick={() => setSearchMode("dropdown")}
            >
              Pick a game
            </button>
            <button
              className={searchMode === "text" ? "active" : ""}
              onClick={() => setSearchMode("text")}
            >
              Describe what you want
            </button>
          </div>

          {searchMode === "dropdown" ? (
            <div className="search-box">
              <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)}>
                <option value="">Select a Game</option>
                {games.map((game) => (
                  <option key={game}>{game}</option>
                ))}
              </select>
              <button onClick={fetchRecommendations} disabled={loading}>
                {loading ? "Loading..." : "Get Recommendations"}
              </button>
            </div>
          ) : (
            <div className="search-box">
              <input
                type="text"
                placeholder='e.g. "relaxing farming game" or "scary co-op horror"'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchByText()}
              />
              <button onClick={fetchByText} disabled={loading}>
                {loading ? "Loading..." : "Search"}
              </button>
            </div>
          )}

          {wakingUp && (
            <div className="wake-notice">
              <div className="wake-spinner" />
              <div>
                <strong>Waking up the server…</strong>
                <p>
                  This app sleeps after inactivity to save resources.
                  First request after a break can take up to 50 seconds.
                  Waited {waitSeconds}s — almost there.
                </p>
              </div>
            </div>
          )}

          {loading && !wakingUp && (
            <div className="loading">Loading recommendations...</div>
          )}

          {recommendations.length > 0 && (
            <>
              <h2 className="results-title">🔥 {resultsLabel}</h2>

              <div className="results">
                {recommendations.map((game) => (
                  <div className="game-card" key={game.app_id} onClick={() => fetchGameDetail(game.app_id)}>
                    <img src={game.header_image} alt={game.name} />
                    <div className="card-content">
                      <div className="card-header">
                        <h3>{game.name}</h3>
                        <span className="price">€{game.price_eur.toFixed(2)}</span>
                      </div>
                      <p className="genres">{game.genres}</p>
                      <div className="card-meta-row">
                        <span className={`meta-score ${!game.metacritic_score ? "na" : ""}`}>
                          {game.metacritic_score ? `MC ${game.metacritic_score}` : "No score"}
                        </span>
                        <span className="view-hint">Click for details</span>
                      </div>
                      <div className="progress">
                        <div className="progress-fill" style={{ width: `${game.similarity_score * 100}%` }} />
                      </div>
                      <div className="score">{(game.similarity_score * 100).toFixed(1)}% Match</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedDetail && (
                <div className="modal-overlay" onClick={() => setSelectedDetail(null)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close" onClick={() => setSelectedDetail(null)}>✕</button>
                    <img src={selectedDetail.header_image} alt={selectedDetail.name} className="detail-image" />
                    <h2>{selectedDetail.name}</h2>
                    <p className="detail-short">{selectedDetail.short_description}</p>
                    <div className="detail-grid">
                      <div><strong>Price:</strong> €{selectedDetail.price_eur}</div>
                      <div><strong>Metacritic:</strong> {selectedDetail.metacritic_score}</div>
                      <div><strong>Release:</strong> {selectedDetail.release_date}</div>
                      <div><strong>Developer:</strong> {selectedDetail.developers}</div>
                      <div><strong>Publisher:</strong> {selectedDetail.publishers}</div>
                      <div><strong>Genres:</strong> {selectedDetail.genres}</div>
                    </div>
                    <h3>Description</h3>
                    <div className="detail-description" dangerouslySetInnerHTML={{ __html: selectedDetail.detailed_description }} />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;