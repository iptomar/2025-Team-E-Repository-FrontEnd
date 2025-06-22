import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

const DeleteConfirmationModal = ({ show, onHide, onConfirm, scheduleName, loading }) => {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="text-danger">
                    <FaTrash className="me-2" />
                    Confirmar Eliminação
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="alert alert-danger">
                    <strong>Atenção!</strong> Esta ação não pode ser desfeita.
                </div>
                <p>
                    Tem a certeza que pretende eliminar o horário{' '}
                    <strong>"{scheduleName}"</strong>?
                </p>
                <p className="text-muted">
                    Todos os blocos e eventos associados a este horário serão permanentemente removidos.
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancelar
                </Button>
                <Button variant="danger" onClick={onConfirm} disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            A eliminar...
                        </>
                    ) : (
                        <>
                            <FaTrash className="me-2" />
                            Eliminar Horário
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteConfirmationModal;
