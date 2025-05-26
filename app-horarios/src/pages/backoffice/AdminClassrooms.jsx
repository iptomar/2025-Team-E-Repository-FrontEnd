import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Container, Table, InputGroup, FormControl, Button, Pagination,
    Spinner, Modal, Form
} from "react-bootstrap";

const API_BASE = import.meta.env.VITE_WS_URL;

const AdminClassrooms = () => {
    const token = localStorage.getItem("token");
    const [classrooms, setClassrooms] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        id: null,
        Name: "",
        SchoolFK: "",
        Allocation: ""
    });

    const isEditMode = modalData.id !== null;

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/admin/classrooms?page=${page}&limit=10&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClassrooms(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) {
            console.error("Erro ao carregar salas:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, [page]);

    const debounceRef = useRef(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            fetchClassrooms();
        }, 1000);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const openCreateModal = () => {
        setModalData({ id: null, Name: "", SchoolFK: "", Allocation: "" });
        setShowModal(true);
    };

    const openEditModal = (classroom) => {
        setModalData({
            id: classroom.Id,
            Name: classroom.Name,
            SchoolFK: classroom.SchoolFK,
            Allocation: classroom.Allocation
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tens a certeza que queres apagar esta sala?")) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/classrooms/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchClassrooms();
        } catch (err) {
            console.error("Erro ao apagar:", err);
        }
    };

    const handleSave = async () => {
        const { Name, SchoolFK, Allocation } = modalData;
        if (!Name || !SchoolFK || !Allocation) {
            alert("Por favor preencha todos os campos obrigatórios.");
            return;
        }

        try {
            const payload = {
                ...modalData,
                [isEditMode ? "UpdatedBy" : "CreatedBy"]: "admin"
            };

            if (isEditMode) {
                await axios.put(`${API_BASE}/api/admin/classrooms/${modalData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/api/admin/classrooms`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchClassrooms();
        } catch (err) {
            console.error("Erro ao guardar:", err);
        }
    };

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestão de Salas</h2>
                <Button onClick={openCreateModal}>+ Nova Sala</Button>
            </div>

            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Pesquisar por nome ou alocação..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </InputGroup>

            {loading ? (
                <div className="text-center"><Spinner animation="border" /></div>
            ) : (
                <>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Alocação</th>
                                <th>Escola FK</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classrooms.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted">
                                        Sem resultados encontrados.
                                    </td>
                                </tr>
                            ) : (
                                classrooms.map((c) => (
                                    <tr key={c.Id}>
                                        <td>{c.Name}</td>
                                        <td>{c.Allocation}</td>
                                        <td>{c.SchoolFK}</td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" onClick={() => openEditModal(c)} className="me-2">Editar</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(c.Id)}>Apagar</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>

                    {totalPages > 1 && (
                        <Pagination className="justify-content-center">
                            <Pagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
                            {Array.from({ length: totalPages }, (_, i) => (
                                <Pagination.Item
                                    key={i + 1}
                                    active={i + 1 === page}
                                    onClick={() => setPage(i + 1)}
                                >
                                    {i + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next disabled={page === totalPages} onClick={() => setPage(page + 1)} />
                        </Pagination>
                    )}
                </>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? "Editar Sala" : "Nova Sala"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nome</Form.Label>
                            <Form.Control
                                type="text"
                                value={modalData.Name}
                                onChange={(e) => setModalData({ ...modalData, Name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Alocação</Form.Label>
                            <Form.Control
                                type="text"
                                value={modalData.Allocation}
                                onChange={(e) => setModalData({ ...modalData, Allocation: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Escola FK</Form.Label>
                            <Form.Control
                                type="number"
                                value={modalData.SchoolFK}
                                onChange={(e) => setModalData({ ...modalData, SchoolFK: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSave}>Guardar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminClassrooms;