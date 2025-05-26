import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Container, Table, InputGroup, FormControl, Button, Pagination,
    Spinner, Modal, Form
} from "react-bootstrap";

const API_BASE = import.meta.env.VITE_WS_URL;

const AdminPeople = () => {
    const token = localStorage.getItem("token");
    const [people, setPeople] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        id: null,
        IdIpt: "",
        Name: "",
        Email: "",
        Title: "",
        Password: "",
        Roles: []
    });

    const isEditMode = modalData.id !== null;

    const fetchPeople = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/admin/people?page=${page}&limit=10&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPeople(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) {
            console.error("Erro ao carregar utilizadores:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeople();
    }, [page]);

    const debounceRef = useRef(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            fetchPeople();
        }, 1000);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const openCreateModal = () => {
        setModalData({ id: null, IdIpt: "", Name: "", Email: "", Title: "", Password: "", Roles: [] });
        setShowModal(true);
    };

    const openEditModal = async (person) => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/people/${person.Id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fullData = res.data;
            setModalData({
                id: fullData.Id,
                IdIpt: fullData.IdIpt,
                Name: fullData.Name,
                Email: fullData.Email,
                Title: fullData.Title,
                Password: "", // nunca mostra a password
                Roles: fullData.Roles || []
            });
            setShowModal(true);
        } catch (err) {
            console.error("Erro ao carregar dados do utilizador:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tens a certeza que queres apagar este utilizador?")) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/people/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPeople();
        } catch (err) {
            console.error("Erro ao apagar:", err);
        }
    };

    const handleSave = async () => {
        const { IdIpt, Name, Email, Title, Password, Roles } = modalData;

        if (!IdIpt || !Name || !Email || !Title || (!isEditMode && !Password)) {
            alert("Preenche todos os campos obrigatórios.");
            return;
        }

        try {
            const payload = {
                IdIpt, Name, Email, Title, Password, Roles,
                [isEditMode ? "UpdatedBy" : "CreatedBy"]: "admin"
            };

            if (isEditMode) {
                await axios.put(`${API_BASE}/api/admin/people/${modalData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/api/admin/people`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchPeople();
        } catch (err) {
            console.error("Erro ao guardar:", err);
        }
    };

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestão de Utilizadores</h2>
                <Button onClick={openCreateModal}>+ Novo Utilizador</Button>
            </div>

            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Pesquisar por nome ou email..."
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
                                <th>ID IPT</th>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Título</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {people.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted">
                                        Sem resultados encontrados.
                                    </td>
                                </tr>
                            ) : (
                                people.map((p) => (
                                    <tr key={p.Id}>
                                        <td>{p.IdIpt}</td>
                                        <td>{p.Name}</td>
                                        <td>{p.Email}</td>
                                        <td>{p.Title}</td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" onClick={() => openEditModal(p)} className="me-2">Editar</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p.Id)}>Apagar</Button>
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
                    <Modal.Title>{isEditMode ? "Editar Utilizador" : "Novo Utilizador"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>ID IPT</Form.Label>
                            <Form.Control
                                type="text"
                                value={modalData.IdIpt}
                                onChange={(e) => setModalData({ ...modalData, IdIpt: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nome</Form.Label>
                            <Form.Control
                                type="text"
                                value={modalData.Name}
                                onChange={(e) => setModalData({ ...modalData, Name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={modalData.Email}
                                onChange={(e) => setModalData({ ...modalData, Email: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Título</Form.Label>
                            <Form.Control
                                type="text"
                                value={modalData.Title}
                                onChange={(e) => setModalData({ ...modalData, Title: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={modalData.Password}
                                placeholder={isEditMode ? "••••••••" : ""}
                                onChange={(e) => setModalData({ ...modalData, Password: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Roles (IDs separados por vírgula)</Form.Label>
                            <Form.Control
                                type="text"
                                value={modalData.Roles.join(",")}
                                onChange={(e) =>
                                    setModalData({ ...modalData, Roles: e.target.value.split(",").map(Number) })
                                }
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

export default AdminPeople;