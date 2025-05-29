import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

const CalendarView = () => {
    const { scheduleId } = useParams();
    const navigate = useNavigate();

    // State management
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedView, setSelectedView] = useState('week'); // week, month, list

    // Fetch schedule data
    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_WS_URL}/api/schedules/${scheduleId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch schedule');
                }

                const data = await response.json();
                setSchedule(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (scheduleId) {
            fetchSchedule();
        }
    }, [scheduleId]);

    // Helper function to format time
    const formatTime = (timeString) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper function to get day name
    const getDayName = (dayNumber) => {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return days[dayNumber];
    };

    // Group schedule items by day
    const groupByDay = (items) => {
        return items.reduce((groups, item) => {
            const day = item.dayOfWeek;
            if (!groups[day]) {
                groups[day] = [];
            }
            groups[day].push(item);
            return groups;
        }, {});
    };

    if (loading) {
        return (
            <Container className="mainContainer">
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-2">Carregando horário...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mainContainer">
                <Alert variant="danger">
                    <Alert.Heading>Erro ao carregar horário</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={() => navigate('/schedules')}>
                        Voltar aos Horários
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (!schedule) {
        return (
            <Container className="mainContainer">
                <Alert variant="warning">
                    <Alert.Heading>Horário não encontrado</Alert.Heading>
                    <p>O horário solicitado não foi encontrado.</p>
                    <Button variant="outline-warning" onClick={() => navigate('/schedules')}>
                        Voltar aos Horários
                    </Button>
                </Alert>
            </Container>
        );
    }

    const groupedSchedule = groupByDay(schedule.items || []);

    return (
        <Container className="mainContainer">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="headerText">Visualizar Horário</h2>
                            <h4>{schedule.name}</h4>
                            <p className="text-muted">
                                Criado em: {new Date(schedule.createdAt).toLocaleDateString('pt-PT')}
                            </p>
                        </div>
                        <div>
                            <Button
                                variant="outline-secondary"
                                className="me-2"
                                onClick={() => navigate()}
                            >
                                Voltar
                            </Button>
                            <Button
                                variant="primary"
                                className="button"
                                onClick={() => navigate()}
                            >
                                Editar
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* View Controls */}
            <Row className="mb-3">
                <Col>
                    <Card className="card">
                        <Card.Body>
                            <Form.Group>
                                <Form.Label>Visualização:</Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Check
                                        type="radio"
                                        id="view-week"
                                        name="view"
                                        label="Semanal"
                                        checked={selectedView === 'week'}
                                        onChange={() => setSelectedView('week')}
                                    />
                                    <Form.Check
                                        type="radio"
                                        id="view-list"
                                        name="view"
                                        label="Lista"
                                        checked={selectedView === 'list'}
                                        onChange={() => setSelectedView('list')}
                                    />
                                </div>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Schedule Content */}
            {selectedView === 'week' ? (
                /* Week View */
                <Row>
                    {[1, 2, 3, 4, 5].map(day => (
                        <Col key={day} lg={2} md={4} sm={6} className="mb-3">
                            <Card className="card h-100">
                                <Card.Header className="cardHeader text-center">
                                    {getDayName(day)}
                                </Card.Header>
                                <Card.Body className="p-2">
                                    {groupedSchedule[day] ? (
                                        groupedSchedule[day]
                                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                            .map((item, index) => (
                                                <div key={index} className="mb-2 p-2 border rounded">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div className="flex-grow-1">
                                                            <strong className="d-block">{item.subject}</strong>
                                                            <small className="text-muted d-block">
                                                                {item.professor}
                                                            </small>
                                                            <small className="text-muted">
                                                                {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                                            </small>
                                                        </div>
                                                        <Badge
                                                            bg={item.tipologia === 'Teorico-Pratica' ? 'warning' :
                                                                item.tipologia === 'Pratica' ? 'success' : 'info'}
                                                            className="ms-1"
                                                        >
                                                            {item.tipologia === 'Teorico-Pratica' ? 'TP' :
                                                                item.tipologia === 'Pratica' ? 'P' : 'T'}
                                                        </Badge>
                                                    </div>
                                                    {item.room && (
                                                        <small className="text-muted d-block mt-1">
                                                            Sala: {item.room}
                                                        </small>
                                                    )}
                                                </div>
                                            ))
                                    ) : (
                                        <p className="text-muted text-center small">Sem aulas</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                /* List View */
                <Row>
                    <Col>
                        <Card className="card">
                            <Card.Header className="cardHeader">
                                Lista de Aulas
                            </Card.Header>
                            <Card.Body>
                                {Object.entries(groupedSchedule)
                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                    .map(([day, items]) => (
                                        <div key={day} className="mb-4">
                                            <h5 className="border-bottom pb-2">{getDayName(parseInt(day))}</h5>
                                            {items
                                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                .map((item, index) => (
                                                    <div key={index} className="d-flex justify-content-between align-items-center p-3 border rounded mb-2">
                                                        <div>
                                                            <strong>{item.subject}</strong>
                                                            <div className="text-muted">
                                                                {item.professor}
                                                            </div>
                                                            <small className="text-muted">
                                                                {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                                                {item.room && ` • Sala: ${item.room}`}
                                                            </small>
                                                        </div>
                                                        <Badge
                                                            bg={item.tipologia === 'Teorico-Pratica' ? 'warning' :
                                                                item.tipologia === 'Pratica' ? 'success' : 'info'}
                                                        >
                                                            {item.tipologia === 'Teorico-Pratica' ? 'TP' :
                                                                item.tipologia === 'Pratica' ? 'P' : 'T'}
                                                        </Badge>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    ))
                                }

                                {Object.keys(groupedSchedule).length === 0 && (
                                    <div className="text-center text-muted py-4">
                                        <p>Este horário não possui aulas agendadas.</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Schedule Statistics */}
            <Row className="mt-4">
                <Col>
                    <Card className="card">
                        <Card.Header className="cardHeader">
                            Estatísticas do Horário
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={3}>
                                    <div className="text-center">
                                        <h4>{schedule.items?.length || 0}</h4>
                                        <small className="text-muted">Total de Aulas</small>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="text-center">
                                        <h4>{Object.keys(groupedSchedule).length}</h4>
                                        <small className="text-muted">Dias com Aulas</small>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="text-center">
                                        <h4>
                                            {schedule.items?.reduce((total, item) => {
                                                const start = new Date(`2000-01-01T${item.startTime}`);
                                                const end = new Date(`2000-01-01T${item.endTime}`);
                                                return total + (end - start) / (1000 * 60 * 60);
                                            }, 0).toFixed(1) || 0}h
                                        </h4>
                                        <small className="text-muted">Horas Semanais</small>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="text-center">
                                        <h4>
                                            {new Set(schedule.items?.map(item => item.subject)).size || 0}
                                        </h4>
                                        <small className="text-muted">Disciplinas</small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CalendarView;
