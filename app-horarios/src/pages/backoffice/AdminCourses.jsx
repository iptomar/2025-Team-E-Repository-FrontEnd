import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Container, Table, InputGroup, FormControl, Button, Pagination,
    Spinner, Modal, Form
} from "react-bootstrap";

const API_BASE = import.meta.env.VITE_WS_URL;

const AdminCourses = () => {
    const token = localStorage.getItem("token");
    const [courses, setCourses] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        id: null,
        IdCourse: "",
        Name: "",
        SchoolFK: ""
    });

    const isEditMode = modalData.id !== null;

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/admin/courses?page=${page}&limit=10&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) {
            console.error("Erro ao carregar cursos:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [page]);

    const debounceRef = useRef(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            fetchCourses();
        }, 500);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const openCreateModal = () => {
        setModalData({ id: null, IdCourse: "", Name: "", SchoolFK: "" });
        setShowModal(true);
    };

    const openEditModal = (course) => {
        setModalData({
            id: course.Id,
            IdCourse: course.IdCourse,
            Name: course.Name,
            SchoolFK: course.SchoolFK
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tens a certeza que queres apagar este curso?")) return;
        try {
            await axios.delete(`${API_BASE}/api/admin/courses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCourses();
        } catch (err) {
            console.error("Erro ao apagar:", err);
        }
    };

    const handleSave = async () => {
        const { IdCourse, Name, SchoolFK } = modalData;

        if (!IdCourse || !Name || !SchoolFK) {
            alert("Por favor preencha todos os campos obrigatórios.");
            return;
        }

        try {
            if (isEditMode) {
                await axios.put(`${API_BASE}/api/admin/courses/${modalData.id}`, {
                    ...modalData,
                    UpdatedBy: "admin"
                }, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${API_BASE}/api/admin/courses`, {
                    ...modalData,
                    CreatedBy: "admin"
                }, { headers: { Authorization: `Bearer ${token}` } });
            }
            setShowModal(false);
            fetchCourses();
        } catch (err) {
            console.error("Erro ao guardar:", err);
        }
    };

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestão de Cursos</h2>
                <Button onClick={openCreateModal}>+ Novo Curso</Button>
            </div>

            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Pesquisar por nome ou código..."
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
                                <th>Escola</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted">
                                        Sem resultados encontrados.
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course) => (
                                    <tr key={course.Id}>
                                        <td>{course.IdCourse}</td>
                                        <td>{course.Name}</td>
                                        <td>{course.SchoolFK}</td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => openEditModal(course)}
                                                className="me-2"
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(course.Id)}
                                            >
                                                Apagar
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>

                    {totalPages > 1 && (
                        <Pagination className="justify-content-center">
                            <Pagination.Prev
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            />
                            {Array.from({ length: totalPages }, (_, i) => (
                                <Pagination.Item
                                    key={i + 1}
                                    active={i + 1 === page}
                                    onClick={() => setPage(i + 1)}
                                >
                                    {i + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                            />
                        </Pagination>
                    )}
                </>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? "Editar Curso" : "Novo Curso"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>ID Curso</Form.Label>
                            <Form.Control
                                type="text"
                                value={modalData.IdCourse}
                                onChange={(e) => setModalData({ ...modalData, IdCourse: e.target.value })}
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

export default AdminCourses;