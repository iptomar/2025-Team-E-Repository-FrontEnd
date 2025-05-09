import '@fullcalendar/core'; // Add this line first
import React, {useState, useEffect, useRef} from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal';
import iptLogo from '../../assets/ipt-logo-full.png';

// Custom CSS for IPT styling
const iptStyles = {

    mainContainer: {
        backgroundColor: '#ffffff',
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    headerText: {
        color: '#b25d31',
        marginBottom: '30px',
        fontWeight: '500',
    },
    card: {
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        boxShadow: 'none',
    },
    cardHeader: {
        backgroundColor: '#f8f9fa',
        color: '#b25d31',
        fontWeight: '500',
        border: 'none',
    },
    button: {
        backgroundColor: '#b25d31',
        borderColor: '#b25d31',
        color: 'white',
        fontWeight: '400',
    },
    formControl: {
        border: '1px solid #ced4da',
        borderRadius: '4px',
        padding: '8px 12px',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        height: '100px', // Set your desired navbar height here
    },
    logo: {
        maxHeight: '100%',
        height: '100%',
        width: 'auto',
    },
    instituteName: {
        marginLeft: '15px',
        color: '#333',
    }
};

/**
 * WeeklySchedule Component
 *
 * This component implements a weekly schedule management system that follows
 * the IPT (Instituto Politécnico de Tomar) design style.
 */
export default function WeeklySchedule() {
    // State for courses and their required hours
    const [courses, setCourses] = useState([
        { id: 1, name: 'An. Matemática II', requiredHours: 3, allocatedHours: 0, color: '#b25d31' },
        { id: 2, name: 'Prog. Orient. Obj.', requiredHours: 3, allocatedHours: 0, color: '#5d9b42' },
        { id: 3, name: 'Lab. Microstat.', requiredHours: 3, allocatedHours: 0, color: '#4285f4' },
        { id: 4, name: 'Mat. Computac.', requiredHours: 3, allocatedHours: 0, color: '#aa46bb' },
        { id: 5, name: 'Int. à Prog. Web', requiredHours: 3, allocatedHours: 0, color: '#f4b400' },
    ]);

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

        // Add event without room initially
        const selectedCourse = courses.find(c => c.id === currentCourse);
        const newEvent = {
            id: Date.now(),
            title: `${selectedCourse.name} (Sem sala)`,
            start: selectInfo.startStr,
            end: selectInfo.endStr,
            backgroundColor: selectedCourse.color,
            extendedProps: {
                courseId: currentCourse,
                room: '',
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

        // Update the event with the selected room
        const selectedCourse = courses.find(c => c.id === selectedEvent.extendedProps.courseId);
        const roomName = rooms.find(r => r.id === parseInt(selectedRoom)).name;

        setEvents(events.map(event => {
            if (parseInt(event.id) === parseInt(selectedEvent.id)) {
                return {
                    ...event,
                    title: `${selectedCourse.name} - ${roomName}`,
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
        <Container fluid style={iptStyles.mainContainer}>
            {/* IPT Logo and Title */}
            <Row className="mb-4">
                <Col className="d-flex align-items-center">
                    <div style={iptStyles.logoContainer}>
                        <img
                            src={iptLogo}
                            alt="IPT Logo"
                            style={{...iptStyles.logo, height: '100%'}}
                        />
                    </div>
                </Col>
            </Row>

            <h2 style={iptStyles.headerText} className="text-center">Plataforma de Gestão de Horários</h2>

            {message.text && (
                <Alert variant={message.type} onClose={() => setMessage({ text: '', type: '' })} dismissible>
                    {message.text}
                </Alert>
            )}

            <Row>
                <Col md={3}>
                    <Card className="mb-4" style={iptStyles.card}>
                        <Card.Header style={iptStyles.cardHeader}>Cadeiras</Card.Header>
                        <Card.Body>
                            <Form>
                                {courses.map(course => (
                                    <div key={course.id} className="mb-3">
                                        <Form.Check
                                            type="radio"
                                            id={`course-${course.id}`}
                                            name="course"
                                            label={
                                                <span>
                                                {course.name}
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

                    <Card className="mb-4" style={iptStyles.card}>
                        <Card.Header style={iptStyles.cardHeader}>Instruções</Card.Header>
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
                    <Card style={iptStyles.card}>
                        <Card.Body>
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[timeGridPlugin, interactionPlugin]}
                                initialView="timeGridWeek"
                                headerToolbar={{
                                    left: "",
                                    center: "title",
                                    right: ""
                                }}
                                titleFormat={{ weekday: 'long' }}
                                dayHeaderFormat={{ weekday: 'short' }}
                                hiddenDays={[0]}
                                slotDuration="00:30:00"
                                slotMinTime="08:30:00"
                                slotMaxTime="23:30:00"
                                allDaySlot={false}
                                weekends={false}
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
                            <Card className="mb-4" style={iptStyles.card}>
                                <Card.Header style={iptStyles.cardHeader}>Estado do Horário</Card.Header>
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
                                                className="w-100"
                                                disabled={!scheduleComplete}
                                                onClick={saveSchedule}
                                                style={iptStyles.button}
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
                <Modal.Header style={{backgroundColor: '#f8f9fa'}}>
                    <Modal.Title style={{color: '#b25d31'}}>Selecionar Sala</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedEvent && (
                        <>
                            <p><strong>Cadeira:</strong> {courses.find(c => c.id === selectedEvent.extendedProps.courseId).name}</p>
                            <p><strong>Horário:</strong> {new Date(selectedEvent.start).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedEvent.end).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}</p>
                            <p><strong>Dia:</strong> {new Date(selectedEvent.start).toLocaleDateString('pt-PT', {weekday: 'long', day: 'numeric', month: 'long'})}</p>

                            <Form.Group className="mb-3">
                                <Form.Label>Sala:</Form.Label>
                                <Form.Select
                                    value={selectedRoom}
                                    onChange={(e) => setSelectedRoom(e.target.value)}
                                    style={iptStyles.formControl}
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
                    <Button style={iptStyles.button} onClick={handleRoomAssign}>
                        Confirmar
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );

}
