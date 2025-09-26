import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
} from "react-bootstrap";
import TracklistModal from "./TracklistModal";

const DiscogsLoginAndCollection = ({ collection = null }) => {
  const [_loading] = useState(false);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [tracklist, setTracklist] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  const handleLogin = () => {
    window.location.href = "/api/discogs/login";
  };

  useEffect(() => {
    // Check auth status on mount
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/discogs/status", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setLoggedIn(!!data.authenticated);
        // auto-fetch collection if authenticated
        // App-level collection will be used; nothing to fetch here
      } catch (err) {
        console.warn("Status check failed", err);
      }
    };
    checkStatus();
  }, []);

  // collection is provided by App as a prop to keep a single source of truth

  // Fetch and show tracklist for a release
  const handleShowTracklist = async (item) => {
    const releaseId = item.basic_information?.id || item.id;
    if (!releaseId) {
      setError("Cannot determine release id for tracklist");
      return;
    }
    setSelectedRelease(item);
    setShowModal(true);
    setTracksLoading(true);
    setTracklist([]);
    try {
      const resourceUrl = item.basic_information?.resource_url;
      const qs = resourceUrl
        ? `resource_url=${encodeURIComponent(resourceUrl)}`
        : `release_id=${encodeURIComponent(releaseId)}`;
      const res = await fetch(`/api/discogs/tracklist?${qs}`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401)
          throw new Error("Please log in to view tracklist");
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to fetch tracklist");
      }
      const data = await res.json();
      setTracklist(data.tracklist || []);
    } catch (err) {
      setError(err.message || "Failed to load tracklist");
    } finally {
      setTracksLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRelease(null);
    setTracklist([]);
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4 text-center">Discogs User Collection</h2>
      <div className="mb-3 text-center">
        {!loggedIn && (
          <Button variant="success" onClick={handleLogin} className="me-2">
            Login with Discogs
          </Button>
        )}
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {/* Only show a short summary here so the main list is controlled by DiscogsSearch */}
      <Row>
        <Col className="text-center mb-3">
          {collection && collection.length > 0 ? (
            <Alert variant="success">
              You have <strong>{collection.length}</strong> releases in your
              collection.
            </Alert>
          ) : (
            <Alert variant="info">No releases found in your collection.</Alert>
          )}
          <div>
            {!loggedIn && (
              <Button variant="success" onClick={handleLogin} className="me-2">
                Login with Discogs
              </Button>
            )}
            {loggedIn && (
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            )}
          </div>
        </Col>
      </Row>
      <TracklistModal
        show={showModal}
        onHide={handleCloseModal}
        loading={tracksLoading}
        tracklist={tracklist}
        title={
          selectedRelease
            ? selectedRelease.basic_information?.title || selectedRelease.title
            : "Tracklist"
        }
      />
    </Container>
  );
};
export default DiscogsLoginAndCollection;
