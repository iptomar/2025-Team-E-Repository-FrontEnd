import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Container, Table, Button, Spinner, Modal, Form,
    InputGroup, FormControl, Pagination
} from "react-bootstrap";

const API_BASE = import.meta.env.VITE_WS_URL;

const AdminSubjectsProfessors = () => {
    const token = localStorage.getItem("token");
    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedProfessor, setSelectedProfessor] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/admin/subjects-professors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const filtered = res.data.filter(row =>
                row.Subject.toLowerCase().includes(search.toLowerCase()) ||
                row.Professor.toLowerCase().includes(search.toLowerCase())
            );
            setData(filtered);
            setTotalPages(Math.ceil(filtered.length / 10));
        } catch (err) {
            console.error("Erro ao carregar associações:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search]);

    const debounceRef = useRef(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            fetchData();
        }, 1000);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const fetchOptions = async () => {
        try {
            const [subsRes, profsRes] = await Promise.all([
                axios.get(`${API_BASE}/api/admin/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE}/api/admin/people`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setSubjects(subsRes.data.data || []);
            setProfessors(profsRes.data.data || []);
        } catch (err) {
            console.error("Erro ao carregar listas:", err);
        }
    };

    const openModal = () => {
        setSelectedSubject("");
        setSelectedProfessor("");
        fetchOptions();
        setShowModal(true);
    };

    const handleAssign = async () => {
        if (!selectedSubject || !selectedProfessor) return alert("Seleciona ambos os campos.");
        try {
            await axios.post(`${API_BASE}/api/admin/subjects-professors`, {
                subjectId: selectedSubject,
                professorId: selectedProfessor
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error("Erro ao atribuir:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remover associação?")) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/subjects-professors/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error("Erro ao remover:", err);
        }
    };

    const paginatedData = data.slice((page - 1) * 10, page * 10);

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Professores por Unidade Curricular</h2>
                <Button onClick={openModal}>+ Atribuir Professor</Button>
            </div>

            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Pesquisar por professor ou cadeira..."
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
                                <th>Cadeira</th>
                                <th>Professor</th>
                                <th>Tipologia</th>
                                <th>Horas</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted">Sem dados</td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.Id}>
                                        <td>{row.Subject}</td>
                                        <td>{row.Professor}</td>
                                        <td>{row.Tipologia}</td>
                                        <td>{row.TotalHours}h (T:{row.HoursT} / TP:{row.HoursTP} / P:{row.HoursP})</td>
                                        <td>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(row.Id)}
                                            >
                                                Remover
                                            </Button>
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
                    <Modal.Title>Atribuir Professor a UC</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Unidade Curricular</Form.Label>
                            <Form.Select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                                <option value="">Seleciona uma cadeira</option>
                                {subjects.map((s) => (
                                    <option key={s.Id} value={s.Id}>{s.Name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Professor</Form.Label>
                            <Form.Select value={selectedProfessor} onChange={(e) => setSelectedProfessor(e.target.value)}>
                                <option value="">Seleciona um professor</option>
                                {professors.map((p) => (
                                    <option key={p.Id} value={p.Id}>{p.Name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleAssign}>Guardar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminSubjectsProfessors;