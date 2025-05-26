import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Container, Table, InputGroup, FormControl, Button, Pagination,
    Spinner, Modal, Form
} from "react-bootstrap";

const API_BASE = import.meta.env.VITE_WS_URL;

const AdminSubjects = () => {
    const token = localStorage.getItem("token");
    const [subjects, setSubjects] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        id: null,
        IdSubject: "",
        Name: "",
        Description: "",
        Tipologia: "Teorico-Pratica",
        HoursT: 0,
        HoursTP: 0,
        HoursP: 0,
        TotalHours: 0
    });

    const isEditMode = modalData.id !== null;

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/admin/subjects?page=${page}&limit=10&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) {
            console.error("Erro ao carregar disciplinas:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [page]);

    const debounceRef = useRef(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            fetchSubjects();
        }, 1000);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const openCreateModal = () => {
        setModalData({
            id: null,
            IdSubject: "",
            Name: "",
            Description: "",
            Tipologia: "Teorico-Pratica",
            HoursT: 0,
            HoursTP: 0,
            HoursP: 0,
            TotalHours: 0
        });
        setShowModal(true);
    };

    const openEditModal = (subject) => {
        setModalData({ ...subject, id: subject.Id });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tens a certeza que queres apagar esta UC?")) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/subjects/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSubjects();
        } catch (err) {
            console.error("Erro ao apagar:", err);
        }
    };

    const handleSave = async () => {
        const { IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours } = modalData;
        if (!IdSubject || !Name || !Description || !Tipologia) {
            alert("Por favor preencha todos os campos obrigatórios.");
            return;
        }

        try {
            const payload = {
                ...modalData,
                [isEditMode ? "UpdatedBy" : "CreatedBy"]: "admin"
            };

            if (isEditMode) {
                await axios.put(`${API_BASE}/api/admin/subjects/${modalData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/api/admin/subjects`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchSubjects();
        } catch (err) {
            console.error("Erro ao guardar:", err);
        }
    };

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestão de Unidades Curriculares</h2>
                <Button onClick={openCreateModal}>+ Nova UC</Button>
            </div>

            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Pesquisar por nome ou descrição..."
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
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Tipologia</th>
                                <th>Horas Totais</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted">
                                        Sem resultados encontrados.
                                    </td>
                                </tr>
                            ) : (
                                subjects.map((s) => (
                                    <tr key={s.Id}>
                                        <td>{s.IdSubject}</td>
                                        <td>{s.Name}</td>
                                        <td>{s.Tipologia}</td>
                                        <td>{s.TotalHours}</td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" onClick={() => openEditModal(s)} className="me-2">Editar</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(s.Id)}>Apagar</Button>
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
                    <Modal.Title>{isEditMode ? "Editar UC" : "Nova UC"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {["IdSubject", "Name", "Description", "HoursT", "HoursTP", "HoursP", "TotalHours"].map(field => (
                            <Form.Group key={field} className="mb-3">
                                <Form.Label>{field}</Form.Label>
                                <Form.Control
                                    type={field.includes("Hours") ? "number" : "text"}
                                    value={modalData[field]}
                                    onChange={(e) => setModalData({ ...modalData, [field]: e.target.value })}
                                />
                            </Form.Group>
                        ))}
                        <Form.Group className="mb-3">
                            <Form.Label>Tipologia</Form.Label>
                            <Form.Select
                                value={modalData.Tipologia}
                                onChange={(e) => setModalData({ ...modalData, Tipologia: e.target.value })}
                            >
                                <option value="Teorica">Teórica</option>
                                <option value="Pratica">Prática</option>
                                <option value="Teorico-Pratica">Teórico-Prática</option>
                            </Form.Select>
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

export default AdminSubjects;