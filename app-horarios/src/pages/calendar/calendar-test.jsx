import '@fullcalendar/core'; // Add this line first
import React, {useState, useEffect, useRef} from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal';
import './Calendar.scss';
import {fetchCoursesWithProfessors} from "../../api/courseFetcher.js";

/**
 * WeeklySchedule Component
 *
 * This component implements a weekly schedule management system that follows
 * the IPT (Instituto Politécnico de Tomar) design style.
 */
export default function WeeklySchedule() {
    // State for courses and their required hours
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [coursesError, setCoursesError] = useState(null);


    const [rooms] = useState([
        { id: 1, name: 'B257' },
        { id: 2, name: 'B128' },
        { id: 3, name: 'B255' },
        { id: 4, name: 'I184' },
    ]);

    // State for calendar events
    const [events, setEvents] = useState([]);

    // State for currently selected course
    const [currentCourse, setCurrentCourse] = useState(null);

    // State for validation messages
    const [message, setMessage] = useState({ text: '', type: '' });

    // State to check if schedule is complete
    const [scheduleComplete, setScheduleComplete] = useState(false);

    // State for room selection modal
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState('');

    // Calendar reference
    const calendarRef = useRef(null);

    useEffect(() => {
        const loadCourses = async () => {
            setLoadingCourses(true);
            setCoursesError(null);
            try {
                const data = await fetchCoursesWithProfessors();
                const colorPalette = ['#b25d31', '#5d9b42', '#4285f4', '#aa46bb', '#f4b400'];
                const transformed = data.map((subject, index) => ({
                    id: subject.Id,
                    name: subject.Subject,
                    professor: subject.Professor,
                    requiredHours: Math.floor(subject.TotalHours / 15) || 3,
                    allocatedHours: 0,
                    color: colorPalette[index % colorPalette.length],
                }));
                setCourses(transformed);
            } catch (err) {
                setCoursesError(err.message || "Erro ao retornar cadeiras");
            } finally {
                setLoadingCourses(false);
            }
        };
        loadCourses();
    }, []);


    // Check if all courses have their hours allocated and all events have rooms
    useEffect(() => {
        const allAllocated = courses.every(course =>
            course.allocatedHours >= course.requiredHours
        );

        const allEventsHaveRooms = events.every(event =>
            event.extendedProps.room && event.extendedProps.room !== ''
        );

        setScheduleComplete(allAllocated && allEventsHaveRooms);
    }, [courses, events]);

    // Handle date selection in calendar
    const handleDateSelect = (selectInfo) => {
        if (!currentCourse) {
            setMessage({ text: 'Selecione uma cadeira antes de adicionar ao horário', type: 'warning' });
            selectInfo.view.calendar.unselect();
            return;
        }

        // Calculate duration in hours
        const start = new Date(selectInfo.start);
        const end = new Date(selectInfo.end);
        const durationHours = (end - start) / (1000 * 60 * 60);

        // Check for overlaps with existing events
        const hasOverlap = events.some(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return (start < eventEnd && end > eventStart);
        });

        if (hasOverlap) {
            setMessage({ text: 'Já existe uma aula neste horário', type: 'danger' });
            selectInfo.view.calendar.unselect();
            return;
        }

        const selectedCourse = courses.find(c => c.id === currentCourse);
        const newEvent = {
            id: Date.now(),
            title: `${selectedCourse.name} (Sem sala) - ${selectedCourse.professor}`,
            start: selectInfo.startStr,
            end: selectInfo.endStr,
            backgroundColor: selectedCourse.color,
            extendedProps: {
                courseId: currentCourse,
                room: '',
                professor: selectedCourse.professor,
                duration: durationHours
            }
        };


        setEvents([...events, newEvent]);

        // Update allocated hours
        setCourses(courses.map(course =>
            course.id === currentCourse
                ? { ...course, allocatedHours: course.allocatedHours + durationHours }
                : course
        ));

        setMessage({ text: `Aula de ${selectedCourse.name} adicionada. Clique na aula para selecionar uma sala.`, type: 'success' });
        selectInfo.view.calendar.unselect();
    };

    // Handle event click to open room selection modal
    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        setSelectedEvent(event);
        setSelectedRoom(event.extendedProps.room || '');
        setShowRoomModal(true);
    };

    // Handle room assignment
    const handleRoomAssign = () => {
        if (!selectedRoom) {
            setMessage({ text: 'Selecione uma sala para a aula', type: 'warning' });
            return;
        }

        // Check if the selected room is already booked for this time slot
        const eventStart = new Date(selectedEvent.start);
        const eventEnd = new Date(selectedEvent.end);

        const roomConflict = events.some(event => {
            if (parseInt(event.id) === parseInt(selectedEvent.id)) return false;

            const start = new Date(event.start);
            const end = new Date(event.end);
            return (
                event.extendedProps.room === selectedRoom &&
                start < eventEnd &&
                end > eventStart
            );
        });

        if (roomConflict) {
            setMessage({ text: 'Esta sala já está ocupada neste horário', type: 'danger' });
            return;
        }

        const selectedCourse = courses.find(c => c.id === selectedEvent.extendedProps.courseId);
        const roomName = rooms.find(r => r.id === parseInt(selectedRoom)).name;
        const professor = selectedCourse.professor;
        setEvents(events.map(event => {
            if (parseInt(event.id) === parseInt(selectedEvent.id)) {
                return {
                    ...event,
                    title: `${selectedCourse.name} - ${roomName} - ${professor}`,
                    extendedProps: {
                        ...event.extendedProps,
                        room: selectedRoom
                    }
                };
            }
            return event;
        }));


        setShowRoomModal(false);
        setMessage({ text: `Sala atribuída com sucesso!`, type: 'success' });
    };

    // Handle event removal
    const handleEventRemove = () => {
        const courseId = selectedEvent.extendedProps.courseId;
        const duration = selectedEvent.extendedProps.duration;

        // Update allocated hours
        setCourses(courses.map(course =>
            course.id === courseId
                ? { ...course, allocatedHours: Math.max(0, course.allocatedHours - duration) }
                : course
        ));

        setEvents(events.filter(e => parseInt(e.id) !== parseInt(selectedEvent.id)));
        setShowRoomModal(false);
        setMessage({ text: 'Aula removida com sucesso!', type: 'info' });
    };

    const saveSchedule = () => {
        // Check if all events have rooms assigned
        const eventsWithoutRooms = events.filter(event => !event.extendedProps.room);

        if (eventsWithoutRooms.length > 0) {
            setMessage({
                text: 'Todas as aulas devem ter uma sala atribuída antes de guardar o horário',
                type: 'warning'
            });
            return;
        }

        alert('Horário guardado com sucesso!');

        const scheduleData = {
            events: events.map(event => ({
                courseId: event.extendedProps.courseId,
                roomId: event.extendedProps.room,
                professor: event.extendedProps.professor || 'Desconhecido',
                start: event.start,
                end: event.end
            }))
        };


        console.log('Schedule data to be saved:', scheduleData);
    };

    function renderEventContent(eventInfo) {
        return (
            <>
                <b>{eventInfo.timeText}</b>
                <i>{eventInfo.event.title}</i>
            </>
        )
    }

    return (
        <Container fluid className="mainContainer">

            <h2 className="headerText text-center">Plataforma de Gestão de Horários</h2>

            {message.text && (
                <Alert variant={message.type} onClose={() => setMessage({ text: '', type: '' })} dismissible>
                    {message.text}
                </Alert>
            )}

            <Row>
                <Col md={3}>
                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Cadeiras</Card.Header>
                        <Card.Body>
                            <Form>
                                {loadingCourses && <Alert variant="info">Carregando cadeiras...</Alert>}
                                {coursesError && <Alert variant="danger">{coursesError}</Alert>}
                                {!loadingCourses && !coursesError && courses.map(course => (
                                    <div key={course.id} className="mb-3">
                                        <Form.Check
                                            type="radio"
                                            id={`course-${course.id}`}
                                            name="course"
                                            label={
                                                <span>
                        {course.name} <span style={{color: "#888"}}>({course.professor})</span>
                        <Badge
                            bg={course.allocatedHours >= course.requiredHours ? "success" : "warning"}
                            className="ms-2"
                        >
                            {course.allocatedHours}/{course.requiredHours}h
                        </Badge>
                    </span>
                                            }
                                            onChange={() => setCurrentCourse(course.id)}
                                            checked={currentCourse === course.id}
                                        />
                                    </div>
                                ))}
                            </Form>

                        </Card.Body>
                    </Card>

                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Instruções</Card.Header>
                        <Card.Body>
                            <ol className="ps-3">
                                <li className="mb-2">Selecione uma cadeira</li>
                                <li className="mb-2">Clique e arraste no calendário para adicionar uma aula</li>
                                <li className="mb-2">Clique na aula para selecionar uma sala</li>
                                <li className="mb-2">Todas as cadeiras devem ter suas horas alocadas</li>
                                <li className="mb-2">Todas as aulas devem ter uma sala atribuída</li>
                            </ol>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={9}>
                    <Card className="card">
                        <Card.Body>
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[timeGridPlugin, interactionPlugin]}
                                initialView="timeGridWeek"
                                headerToolbar= {false}
                                titleFormat={{ weekday: 'long' }}
                                dayHeaderFormat={{ weekday: 'short' }}
                                slotDuration="00:30:00"
                                slotMinTime="08:30:00"
                                slotMaxTime="23:30:00"
                                allDaySlot={false}
                                weekends={true}
                                hiddenDays={[0]} // Esconde o domingo
                                selectable={true}
                                selectMirror={true}
                                dayMaxEvents={true}
                                select={handleDateSelect}
                                eventClick={handleEventClick}
                                events={events}
                                height="auto"
                                locale="pt"
                                firstDay={1}
                                slotLabelFormat={{
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                }}
                                eventTimeFormat={{
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                }}
                                eventContent={renderEventContent}
                            />
                        </Card.Body>
                    </Card>
                    {/* Schedule State - Moved below the calendar */}
                    <Row className="mt-4">
                        <Col md={12}>
                            <Card className="mb-4 card">
                                <Card.Header className="cardHeader">Estado do Horário</Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={9}>
                                            {scheduleComplete ? (
                                                <Alert variant="success">
                                                    Todas as horas foram alocadas e todas as aulas têm salas atribuídas! O horário está completo.
                                                </Alert>
                                            ) : (
                                                <Alert variant="warning">
                                                    Ainda faltam horas a serem alocadas ou aulas sem salas atribuídas.
                                                </Alert>
                                            )}
                                        </Col>
                                        <Col md={3} className="d-flex align-items-center">
                                            <Button
                                                className="w-100 button"
                                                disabled={!scheduleComplete}
                                                onClick={saveSchedule}
                                            >
                                                Guardar Horário
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* Room Selection Modal */}
            <Modal show={showRoomModal} onHide={() => setShowRoomModal(false)}>
                <Modal.Header className="cardHeader">
                    <Modal.Title>Selecionar Sala</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedEvent && (
                        <>
                            <p><strong>Cadeira:</strong> {courses.find(c => c.id === selectedEvent.extendedProps.courseId).name}</p>
                            <p><strong>Professor:</strong> {courses.find(c => c.id === selectedEvent.extendedProps.courseId).professor}</p>
                            <p><strong>Horário:</strong> {new Date(selectedEvent.start).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedEvent.end).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}</p>
                            <p><strong>Dia:</strong> {new Date(selectedEvent.start).toLocaleDateString('pt-PT', {weekday: 'long', day: 'numeric', month: 'long'})}</p>

                            <Form.Group className="mb-3">
                                <Form.Label>Sala:</Form.Label>
                                <Form.Select
                                    value={selectedRoom}
                                    onChange={(e) => setSelectedRoom(e.target.value)}
                                    className="formControl"
                                >
                                    <option value="">Selecione uma sala</option>
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={handleEventRemove}>
                        Remover Aula
                    </Button>
                    <Button variant="secondary" onClick={() => setShowRoomModal(false)}>
                        Cancelar
                    </Button>
                    <Button className="button" onClick={handleRoomAssign}>
                        Confirmar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
