import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Form, Modal } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fetchScheduleById, createEvent, updateEvent, deleteEvent } from '../../../api/calendarFetcher';
import { fetchClassrooms } from '../../../api/classroomFetcher';
import { fetchSubjectsWithProfessors } from '../../../api/courseFetcher';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Edit.scss';
import {FULL_ROUTES} from "../../../routes.jsx";

const CalendarEdit = () => {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [events, setEvents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit'
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formData, setFormData] = useState({
        subjectFK: '',
        classroomFK: '',
        startHour: '',
        endHour: '',
        dayOfWeek: 1
    });

    useEffect(() => {
        const getWeekStart = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        };

        const getColorByTipologia = (tipologia) => {
            switch (tipologia) {
                case 'Teorico': return '#b25d31';
                case 'Pratica': return '#5d9b42';
                case 'Teorico-Pratica': return '#4285f4';
                default: return '#aa46bb';
            }
        };

        const transformBlocksToEvents = (blocks, classrooms, subjects) => {
            if (!blocks) return [];

            const weekStart = getWeekStart(new Date());

            return blocks.map(block => {
                const subject = subjects.find(s => s.Id === block.SubjectFK);
                const classroom = classrooms.find(c => c.Id === block.ClassroomFK);

                const dayOfWeek = block.DayOfWeek || 1;
                const eventDate = new Date(weekStart);
                eventDate.setDate(weekStart.getDate() + (dayOfWeek - 1));

                const [startHour, startMinute] = block.StartHour.split(':');
                const [endHour, endMinute] = block.EndHour.split(':');

                const start = new Date(eventDate);
                start.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

                const end = new Date(eventDate);
                end.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

                return {
                    id: block.Id,
                    title: `${block.SubjectName} - ${block.ClassroomName || 'Sem sala'}`,
                    start: start,
                    end: end,
                    allDay: false,
                    extendedProps: {
                        professor: subject?.Professor || 'N/A',
                        classroom: block.ClassroomName || classroom?.Name || `Sala ${block.ClassroomFK}`,
                        tipologia: subject?.Tipologia || 'N/A',
                        dayOfWeek: dayOfWeek,
                        subjectFK: block.SubjectFK,
                        classroomFK: block.ClassroomFK,
                        blockData: block
                    },
                    backgroundColor: getColorByTipologia(subject?.Tipologia),
                    borderColor: getColorByTipologia(subject?.Tipologia)
                };
            });
        };

        const fetchAllData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const [scheduleData, classroomsData, subjectsData] = await Promise.all([
                    fetchScheduleById(scheduleId, token),
                    fetchClassrooms(),
                    fetchSubjectsWithProfessors()
                ]);

                setSchedule(scheduleData);
                setClassrooms(Array.isArray(classroomsData) ? classroomsData : classroomsData.data || []);
                setSubjects(Array.isArray(subjectsData) ? subjectsData : subjectsData.data || []);

                if (scheduleData?.blocks) {
                    const calendarEvents = transformBlocksToEvents(
                        scheduleData.blocks,
                        classroomsData,
                        subjectsData
                    );
                    setEvents(calendarEvents);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [scheduleId]);

    const handleDateSelect = (selectInfo) => {
        const dayOfWeek = selectInfo.start.getDay() === 0 ? 7 : selectInfo.start.getDay();
        setFormData({
            subjectFK: '',
            classroomFK: '',
            startHour: selectInfo.start.toTimeString().slice(0, 5),
            endHour: selectInfo.end.toTimeString().slice(0, 5),
            dayOfWeek: dayOfWeek
        });
        setModalMode('create');
        setSelectedEvent(null);
        setShowModal(true);
    };

    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        const blockData = event.extendedProps.blockData;

        setFormData({
            subjectFK: blockData.SubjectFK,
            classroomFK: blockData.ClassroomFK,
            startHour: blockData.StartHour.slice(0, 5),
            endHour: blockData.EndHour.slice(0, 5),
            dayOfWeek: blockData.DayOfWeek
        });
        setModalMode('edit');
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const eventData = {
                subjectFK: parseInt(formData.subjectFK),
                classroomFK: parseInt(formData.classroomFK),
                startHour: formData.startHour + ':00',
                endHour: formData.endHour + ':00',
                dayOfWeek: parseInt(formData.dayOfWeek)
            };

            if (modalMode === 'create') {
                await createEvent(scheduleId, token, eventData);
            } else {
                await updateEvent(token, selectedEvent.id, eventData);
            }

            // Refresh data
            window.location.reload();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;

        try {
            const token = localStorage.getItem('token');
            await deleteEvent(token, selectedEvent.id);
            setShowModal(false);
            // Refresh data
            window.location.reload();
        } catch (err) {
            setError(err.message);
        }
    };

    const renderEventContent = (eventInfo) => (
        <>
            <b>{eventInfo.timeText}</b>
            <i>{eventInfo.event.title}</i>
        </>
    );

    if (loading) {
        return (
            <Container fluid className="mainContainer d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <Spinner animation="border" />
                    <div className="mt-2">Carregando horário...</div>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid className="mainContainer">
                <Alert variant="danger" className="mt-4">
                    <Alert.Heading>Erro ao carregar horário</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={() => navigate(FULL_ROUTES.CALENDAR.LISTING)}>
                        Voltar aos Horários
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="mainContainer">
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="headerText mb-0">
                    Editar Horário
                </h2>
            </div>

            <div className="schedule-info mb-4 p-3 bg-light rounded text-center">
                <h4 className="mb-1">{schedule?.Name}</h4>
                <p className="mb-0">
                    Clique em um horário vazio para adicionar uma aula ou em uma aula existente para editar
                </p>
            </div>

            <Row>
                <Col md={3}>
                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Ações</Card.Header>
                        <Card.Body>
                            <div className="d-grid gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate(FULL_ROUTES.CALENDAR.LISTING)}
                                >
                                    📋 Lista de Horários
                                </Button>
                                <Button
                                    variant="info"
                                    onClick={() => navigate(FULL_ROUTES.CALENDAR.VIEW.replace(':scheduleId', scheduleId))}
                                >
                                    👁️ Visualizar Horário
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="card">
                        <Card.Header className="cardHeader">Instruções</Card.Header>
                        <Card.Body>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <strong>Adicionar:</strong> Clique em um horário vazio
                                </li>
                                <li className="mb-2">
                                    <strong>Editar:</strong> Clique em uma aula existente
                                </li>
                                <li className="mb-2">
                                    <strong>Eliminar:</strong> Edite a aula e clique em "Eliminar"
                                </li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={9}>
                    <Card className="card">
                        <Card.Body>
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="timeGridWeek"
                                headerToolbar={false}
                                titleFormat={{ weekday: "long" }}
                                dayHeaderFormat={{ weekday: "short" }}
                                slotDuration="00:30:00"
                                slotMinTime="08:30:00"
                                slotMaxTime="23:30:00"
                                allDaySlot={false}
                                weekends={true}
                                hiddenDays={[0]}
                                dayMaxEvents={true}
                                events={events}
                                eventContent={renderEventContent}
                                eventClick={handleEventClick}
                                height="auto"
                                locale="pt"
                                firstDay={1}
                                slotLabelFormat={{
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                }}
                                eventTimeFormat={{
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Event Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === 'create' ? 'Adicionar Aula' : 'Editar Aula'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleFormSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Disciplina</Form.Label>
                                    <Form.Select
                                        value={formData.subjectFK}
                                        onChange={(e) => setFormData({...formData, subjectFK: e.target.value})}
                                        required
                                    >
                                        <option value="">Selecione uma disciplina</option>
                                        {subjects.map(subject => (
                                            <option key={subject.Id} value={subject.Id}>
                                                {subject.Subject} - {subject.Professor}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Sala</Form.Label>
                                    <Form.Select
                                        value={formData.classroomFK}
                                        onChange={(e) => setFormData({...formData, classroomFK: e.target.value})}
                                        required
                                    >
                                        <option value="">Selecione uma sala</option>
                                        {classrooms.map(classroom => (
                                            <option key={classroom.Id} value={classroom.Id}>
                                                {classroom.Name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Dia da Semana</Form.Label>
                                    <Form.Select
                                        value={formData.dayOfWeek}
                                        onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                                        required
                                    >
                                        <option value={1}>Segunda-feira</option>
                                        <option value={2}>Terça-feira</option>
                                        <option value={3}>Quarta-feira</option>
                                        <option value={4}>Quinta-feira</option>
                                        <option value={5}>Sexta-feira</option>
                                        <option value={6}>Sábado</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Hora de Início</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={formData.startHour}
                                        onChange={(e) => setFormData({...formData, startHour: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Hora de Fim</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={formData.endHour}
                                        onChange={(e) => setFormData({...formData, endHour: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        {modalMode === 'edit' && (
                            <Button variant="danger" onClick={handleDeleteEvent}>
                                Eliminar
                            </Button>
                        )}
                        <Button className="button" type="submit">
                            {modalMode === 'create' ? 'Adicionar' : 'Guardar'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default CalendarEdit;
