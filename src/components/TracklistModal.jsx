import React from "react";
import { Modal, Spinner, ListGroup, Alert } from "react-bootstrap";

const TracklistModal = ({ show, onHide, loading, tracklist, title }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{title || "Tracklist"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : tracklist && tracklist.length > 0 ? (
          <ListGroup>
            {tracklist.map((t, idx) => (
              <ListGroup.Item key={idx}>
                <strong>{t.position || idx + 1}.</strong> {t.title}{" "}
                {t.duration ? `(${t.duration})` : ""}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <Alert variant="info">No tracklist available for this release.</Alert>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default TracklistModal;
