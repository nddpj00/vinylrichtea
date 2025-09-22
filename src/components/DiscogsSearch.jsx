import React, { useState } from "react";
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

const DiscogsSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch(
        `/api/discogs/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError("Failed to fetch results.");
    } finally {
      setLoading(false);
    }
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
              required
            />
          </Col>
          <Col xs={3} sm={2} lg={6}>
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
        {results.map((item) => (
          <Col md={4} lg={3} className="mb-4" key={item.id}>
            <Card>
              {item.cover_image && (
                <Card.Img
                  variant="top"
                  src={item.cover_image}
                  alt={item.title}
                />
              )}
              <Card.Body>
                <Card.Title>{item.title}</Card.Title>
                <Card.Text>
                  <strong>Artist:</strong> {item.artist} <br />
                  <strong>Year:</strong> {item.year || "N/A"}
                </Card.Text>
                <a
                  href={item.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-secondary btn-sm"
                >
                  View on Discogs
                </a>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default DiscogsSearch;
