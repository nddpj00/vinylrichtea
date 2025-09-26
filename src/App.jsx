import React, { useEffect, useState } from "react";
import DiscogsSearch from "./components/DiscogsSearch";
import DiscogsLoginAndCollection from "./components/DiscogsLoginAndCollection";
import RecordPlayer from "./components/RecordPlayer";
import LionelSilhouette from "./components/LionelSilhouette";
import { normalizeCollection } from "./utils/normalizeCollection";
import { Spinner } from "react-bootstrap";

function App() {
  const [username, setUsername] = useState(null);
  const [collection, setCollection] = useState(null);
  const [filteredCollection, setFilteredCollection] = useState(null);
  const [loadingCollection, setLoadingCollection] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/discogs/status", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.username) setUsername(data.username);
        if (data.authenticated) {
          // fetch collection centrally
          try {
            const cRes = await fetch("/api/discogs/collection", {
              credentials: "include",
            });
            if (cRes.ok) {
              const cData = await cRes.json();
              const releases = cData.releases || [];
              const normalized = normalizeCollection(releases);
              setCollection(normalized);
              setFilteredCollection(normalized);
            }
          } catch (e) {
            console.warn("Failed fetching collection in App", e);
          } finally {
            setLoadingCollection(false);
          }
        } else {
          setLoadingCollection(false);
        }
      } catch (e) {
        console.warn("status check failed", e);
      }
    };
    check();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/discogs/logout", {
        method: "POST",
        credentials: "include",
      });
      setUsername(null);
      // reload to clear UI state
      window.location.reload();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <div className="hero d-flex flex-column align-items-center justify-content-center text-center py-5">
      <div
        className="d-flex w-100 justify-content-between align-items-center px-3"
        style={{ maxWidth: 1100 }}
      >
        <div />
        <div className="text-end">
          {username ? (
            <>
              <div>
                Signed in as <strong>{username}</strong>
              </div>
              <button
                className="btn btn-sm btn-outline-light mt-2"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="d-flex align-items-center gap-4 mb-3 justify-content-center">
        <RecordPlayer size={90} />
        <div>
          <h1 className="display-4 mb-0">VinylRichtea</h1>
          <p className="lead mb-0">
            Find, collect, and celebrate vinyl — powered by Discogs
          </p>
        </div>
        <LionelSilhouette size={90} />
      </div>
      <div className="w-100 px-3" style={{ maxWidth: 1100 }}>
        {loadingCollection ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <>
            <DiscogsSearch
              collection={collection}
              setFilteredCollection={setFilteredCollection}
              filteredCollection={filteredCollection}
            />
            <hr />
            <DiscogsLoginAndCollection collection={collection} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
