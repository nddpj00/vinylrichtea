import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
} from "react-bootstrap";
import TracklistModal from "./TracklistModal";

const DiscogsSearch = ({
  collection = [],
  setFilteredCollection = () => {},
  filteredCollection = null,
}) => {
  const [query, setQuery] = useState("");
  const [loading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [tracklist, setTracklist] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [genreFilter, setGenreFilter] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // client-side filter: query + genre
    const q = query.trim().toLowerCase();
    let list = collection || [];
    if (genreFilter) {
      list = list.filter((r) => {
        const genres = (r.basic_information?.genres || []).map((g) =>
          g.toLowerCase()
        );
        return genres.includes(genreFilter.toLowerCase());
      });
    }
    if (q) {
      list = list.filter((r) => {
        const title = (r.basic_information?.title || "").toLowerCase();
        const artists = (r.basic_information?.artists || [])
          .map((a) => a.name.toLowerCase())
          .join(" ");
        return title.includes(q) || artists.includes(q);
      });
    }
    // update App-level filtered collection so other components stay in sync
    setFilteredCollection(list);
  };

  // initialize filtered collection when collection prop changes
  useEffect(() => {
    setFilteredCollection(collection || []);
  }, [collection, setFilteredCollection]);

  // auto-apply filter when genre or query changes
  useEffect(() => {
    // if there's no query and no genre, reset to full collection
    const q = (query || "").trim().toLowerCase();
    if (!q && !genreFilter) {
      setFilteredCollection(collection || []);
      return;
    }
    // reuse handleSearch logic programmatically
    let list = collection || [];
    if (genreFilter) {
      list = list.filter((r) => {
        const genres = (r.basic_information?.genres || []).map((g) =>
          g.toLowerCase()
        );
        return genres.includes(genreFilter.toLowerCase());
      });
    }
    if (q) {
      list = list.filter((r) => {
        const title = (r.basic_information?.title || "").toLowerCase();
        const artists = (r.basic_information?.artists || [])
          .map((a) => a.name.toLowerCase())
          .join(" ");
        return title.includes(q) || artists.includes(q);
      });
    }
    setFilteredCollection(list);
  }, [genreFilter, query, collection, setFilteredCollection]);

  const handleShowTracklist = async (item) => {
    const releaseId = item.id || item.basic_information?.id;
    if (!releaseId) {
      setError("Cannot determine release id");
      return;
    }
    setSelectedRelease(item);
    setShowModal(true);
    setTracksLoading(true);
    setTracklist([]);
    try {
      const resourceUrl =
        item.resource_url || item.basic_information?.resource_url;
      const qs = resourceUrl
        ? `resource_url=${encodeURIComponent(resourceUrl)}`
        : `release_id=${encodeURIComponent(releaseId)}`;
      const res = await fetch(`/api/discogs/tracklist?${qs}`, {
        credentials: "include",
      });
      if (!res.ok) {
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
      <h1 className="mb-4 text-center">Discogs Vinyl Search</h1>
      <Form onSubmit={handleSearch} className="mb-4">
        <Row>
          <Col xs={9} sm={10} lg={6}>
            <Form.Control
              type="text"
              placeholder="Search for an album..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Col>
          <Col xs={6} sm={4} lg={3}>
            <Form.Select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
            >
              <option value="">All genres</option>
              {/* Collect genres from collection for options */}
              {(collection || [])
                .flatMap((r) => r.basic_information?.genres || [])
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
            </Form.Select>
          </Col>
          <Col xs={6} sm={2} lg={3}>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-100"
            >
              {loading ? <Spinner animation="border" size="sm" /> : "Search"}
            </Button>
          </Col>
        </Row>
      </Form>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        {(filteredCollection || collection || []).map((item) => (
          <Col md={4} lg={3} className="mb-4" key={item.id}>
            <Card>
              {item.basic_information?.cover_image && (
                <Card.Img
                  variant="top"
                  src={item.basic_information.cover_image}
                  alt={item.basic_information.title}
                />
              )}
              <Card.Body>
                <Card.Title>{item.basic_information?.title}</Card.Title>
                <Card.Text>
                  <strong>Artist:</strong>{" "}
                  {item.basic_information?.artists
                    ?.map((a) => a.name)
                    .join(", ") || "Unknown"}
                  <br />
                  <strong>Year:</strong> {item.basic_information?.year || "N/A"}
                </Card.Text>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleShowTracklist(item)}
                  >
                    View tracklist
                  </Button>
                  <a
                    href={
                      item.resource_url || item.basic_information?.resource_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-secondary btn-sm"
                  >
                    View on Discogs
                  </a>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <TracklistModal
        show={showModal}
        onHide={handleCloseModal}
        loading={tracksLoading}
        tracklist={tracklist}
        title={
          selectedRelease
            ? selectedRelease.title || selectedRelease.basic_information?.title
            : "Tracklist"
        }
      />
    </Container>
  );
};

export default DiscogsSearch;
