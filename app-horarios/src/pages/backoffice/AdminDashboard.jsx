import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card } from "react-bootstrap";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        if (!user || user.role !== "Admin") {
            navigate("/");
        }
    }, [navigate]);

    const sections = [
        { title: "Escolas", link: "/backoffice/schools", description: "Gerir Escolas" },
        { title: "Cursos", link: "/backoffice/courses", description: "Gerir Cursos" },
        { title: "Cadeiras", link: "/backoffice/subjects", description: "Gerir Unidades Curriculares" },
        { title: "Salas", link: "/backoffice/classrooms", description: "Gerir Salas" },
        { title: "Utilizadores", link: "/backoffice/people", description: "Gerir Contas de Utilizadores" },
        { title: "Professores <> Cadeiras", link: "/backoffice/profsubj", description: "Gerir Professores de Cadeiras" },
        { title: "Cadeiras <> Cursos", link: "/backoffice/people", description: "Gerir Cadeiras de Cursos" }
    ];

    return (
        <Container className="mt-5">
            <h2 className="mb-4 text-center">Painel de Administração</h2>
            <Row>
                {sections.map((section, idx) => (
                    <Col md={6} lg={4} className="mb-4" key={idx}>
                        <Card className="h-100 shadow-sm">
                            <Card.Body className="d-flex flex-column justify-content-between">
                                <div>
                                    <Card.Title>{section.title}</Card.Title>
                                    <Card.Text>{section.description}</Card.Text>
                                </div>
                                <button
                                    className="btn btn-primary mt-3"
                                    onClick={() => navigate(section.link)}
                                >
                                    Aceder
                                </button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default AdminDashboard;
