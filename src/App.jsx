import { useState, useEffect } from "react";
import "./App.css";


/* this APi will change if using deploy and use the API key from dashboard but for locol host const API_BASE = "http://localhost:8000"; */

// Fallback to localhost if no environment variable is specified by the deployment platform
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);

  const [selectedGame, setSelectedGame] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [maxPrice, setMaxPrice] = useState(80);
  const [topN, setTopN] = useState(5);

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedDetail, setSelectedDetail] = useState(null);

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

  const fetchRecommendations = async () => {
    if (!selectedGame) return;

    setLoading(true);

    try {
      const url =
        `${API_BASE}/recommend?game=${encodeURIComponent(selectedGame)}` +
        `&top_n=${topN}` +
        `&max_price=${maxPrice}` +
        `&genre=${selectedGenre}`;

      const res = await fetch(url);
      const data = await res.json();

      setRecommendations(data.recommendations);
    } catch (err) {
      console.error(err);
    }

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

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="All">All</option>

            {genres.map((genre) => (
              <option key={genre}>{genre}</option>
            ))}
          </select>

          <label>Maximum Price (€)</label>

          <input
            type="range"
            min="0"
            max="80"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          <div className="value">
            €{maxPrice}
          </div>

          <label>Recommendations</label>

          <input
            type="range"
            min="3"
            max="10"
            value={topN}
            onChange={(e) => setTopN(e.target.value)}
          />

          <div className="value">
            {topN}
          </div>

        </aside>

        <main>
          <div className="search-box">

            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
            >
              <option value="">
                Select a Game
              </option>

              {games.map((game) => (
                <option key={game}>
                  {game}
                </option>
              ))}
            </select>

            <button onClick={fetchRecommendations}>
              Get Recommendations
            </button>

          </div>

          {loading && (
            <div className="loading">
              Loading recommendations...
            </div>
          )}

          {recommendations.length > 0 && (
            <>
              <h2 className="results-title">
                🔥 Because you liked {selectedGame}
              </h2>



              <div className="results">

                {recommendations.map((game) => (

                  <div
                    className="game-card"
                    key={game.app_id}
                    onClick={() => fetchGameDetail(game.app_id)}
                  >

                    <img
                      src={game.header_image}
                      alt={game.name}
                    />

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
                        <div
                          className="progress-fill"
                          style={{ width: `${game.similarity_score * 100}%` }}
                        />
                      </div>

                      <div className="score">
                        {(game.similarity_score * 100).toFixed(1)}% Match
                      </div>
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