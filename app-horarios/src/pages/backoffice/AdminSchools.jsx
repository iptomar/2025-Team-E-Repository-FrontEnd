import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Container, Table, InputGroup, FormControl, Button, Pagination,
    Spinner, Modal, Form
} from "react-bootstrap";

const API_BASE = import.meta.env.VITE_WS_URL;

const AdminSchools = () => {
    const token = localStorage.getItem("token");
    const [schools, setSchools] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        id: null,
        IdSchool: "",
        Name: "",
        Abbreviation: "",
        InstitutionFK: ""
    });

    const isEditMode = modalData.id !== null;

    const fetchSchools = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/admin/schools?page=${page}&limit=10&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchools(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) {
            console.error("Erro ao carregar escolas:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInstitutions = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/institutions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInstitutions(res.data);
        } catch (err) {
            console.error("Erro ao carregar instituições:", err);
        }
    };

    useEffect(() => {
        fetchSchools();
        fetchInstitutions();
    }, [page]);

    const debounceRef = useRef(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            fetchSchools();
        }, 500);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const openCreateModal = () => {
        setModalData({
            id: null,
            IdSchool: "",
            Name: "",
            Abbreviation: "",
            InstitutionFK: ""
        });
        setShowModal(true);
    };

    const openEditModal = (school) => {
        setModalData({
            id: school.Id,
            IdSchool: school.IdSchool,
            Name: school.Name,
            Abbreviation: school.Abbreviation,
            InstitutionFK: school.InstitutionFK
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tens a certeza que queres apagar esta escola?")) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/schools/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSchools();
        } catch (err) {
            console.error("Erro ao apagar:", err);
        }
    };

    const handleSave = async () => {
        const { IdSchool, Name, Abbreviation, InstitutionFK } = modalData;
        if (!IdSchool || !Name || !Abbreviation || !InstitutionFK) {
            alert("Por favor preencha todos os campos obrigatórios.");
            return;
        }

        try {
            const payload = {
                IdSchool, Name, Abbreviation, InstitutionFK,
                [isEditMode ? "UpdatedBy" : "CreatedBy"]: "admin"
            };

            if (isEditMode) {
                await axios.put(`${API_BASE}/api/admin/schools/${modalData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/api/admin/schools`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchSchools();
        } catch (err) {
            console.error("Erro ao guardar:", err);
        }
    };

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestão de Escolas</h2>
                <Button onClick={openCreateModal}>+ Nova Escola</Button>
            </div>

            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Pesquisar por nome ou sigla..."
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
                                <th>Sigla</th>
                                <th>Instituição</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schools.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted">Sem resultados encontrados.</td>
                                </tr>
                            ) : (
                                schools.map((school) => (
                                    <tr key={school.Id}>
                                        <td>{school.IdSchool}</td>
                                        <td>{school.Name}</td>
                                        <td>{school.Abbreviation}</td>
                                        <td>{school.InstitutionName || "—"}</td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" onClick={() => openEditModal(school)} className="me-2">Editar</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(school.Id)}>Apagar</Button>
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
                                <Pagination.Item key={i + 1} active={i + 1 === page} onClick={() => setPage(i + 1)}>
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
                    <Modal.Title>{isEditMode ? "Editar Escola" : "Nova Escola"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>ID Escola</Form.Label>
                            <Form.Control type="text" value={modalData.IdSchool} onChange={(e) => setModalData({ ...modalData, IdSchool: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nome</Form.Label>
                            <Form.Control type="text" value={modalData.Name} onChange={(e) => setModalData({ ...modalData, Name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Sigla</Form.Label>
                            <Form.Control type="text" value={modalData.Abbreviation} onChange={(e) => setModalData({ ...modalData, Abbreviation: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Instituição</Form.Label>
                            <Form.Select value={modalData.InstitutionFK} onChange={(e) => setModalData({ ...modalData, InstitutionFK: e.target.value })}>
                                <option value="">Seleciona...</option>
                                {institutions.map(inst => (
                                    <option key={inst.Id} value={inst.Id}>{inst.Name}</option>
                                ))}
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

export default AdminSchools;