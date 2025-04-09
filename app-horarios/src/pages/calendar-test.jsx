import '@fullcalendar/core';
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal';
import iptLogo from '../assets/ipt-logo-full.png';
import axios from 'axios';

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
        height: '100px',
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

// API service functions
// Define your JWT token
const API_TOKEN = 'YOUR_HARDCODED_TOKEN';

// API service functions using the token constant
const api = {
    getSubjects: () => axios.get('/api/subjects', {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
    }),
    getClassrooms: () => axios.get('/api/classrooms', {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
    }),
    getSchedule: (scheduleId) => axios.get(`/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
    }),
    saveBlock: (scheduleId, blockData) => axios.post(`/schedules/${scheduleId}/blocks`, blockData, {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
    }),
    updateBlock: (blockId, blockData) => axios.put(`/schedules/blocks/${blockId}`, blockData, {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
    }),
    deleteBlock: (blockId) => axios.delete(`/schedules/blocks/${blockId}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
    })
};


/**
 * WeeklySchedule Component
 *
 * This component implements a weekly schedule management system that follows
 * the IPT (Instituto Politécnico de Tomar) design style.
 */
export default function WeeklySchedule() {
    // State for subjects, classrooms, and schedule data
    const [subjects, setSubjects] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [schedule, setSchedule] = useState(null);
    const [blocks, setBlocks] = useState([]);

    // State for currently selected subject
    const [currentSubject, setCurrentSubject] = useState(null);

    // State for validation messages
    const [message, setMessage] = useState({ text: '', type: '' });

    // State to check if schedule is complete
    const [scheduleComplete, setScheduleComplete] = useState(false);

    // State for room selection modal
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [selectedClassroom, setSelectedClassroom] = useState('');

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Calendar reference
    const calendarRef = useRef(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Get schedule ID from URL or props
                const scheduleId = new URLSearchParams(window.location.search).get('scheduleId');

                if (!scheduleId) {
                    throw new Error('Schedule ID is required');
                }

                // Fetch data in parallel
                const [subjectsRes, classroomsRes, scheduleRes] = await Promise.all([
                    api.getSubjects(),
                    api.getClassrooms(),
                    api.getSchedule(scheduleId)
                ]);

                // Process subjects data to include color and allocated hours
                const processedSubjects = subjectsRes.data.map((subject, index) => ({
                    ...subject,
                    allocatedHours: 0, // Will be calculated based on blocks
                    color: getSubjectColor(index) // Assign colors
                }));

                setSubjects(processedSubjects);
                setClassrooms(classroomsRes.data);
                setSchedule(scheduleRes.data);

                // Convert blocks to calendar events
                if (scheduleRes.data.blocks && scheduleRes.data.blocks.length > 0) {
                    const events = convertBlocksToEvents(
                        scheduleRes.data.blocks,
                        processedSubjects,
                        classroomsRes.data
                    );
                    setBlocks(events);

                    // Calculate allocated hours based on blocks
                    updateAllocatedHours(processedSubjects, scheduleRes.data.blocks);
                }

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Check if all subjects have their hours allocated and all events have classrooms
    useEffect(() => {
        if (subjects.length === 0 || blocks.length === 0) return;

        const allAllocated = subjects.every(subject =>
            subject.allocatedHours >= subject.TotalHours
        );

        const allEventsHaveRooms = blocks.every(block =>
            block.extendedProps.classroomId && block.extendedProps.classroomId !== ''
        );

        setScheduleComplete(allAllocated && allEventsHaveRooms);
    }, [subjects, blocks]);

    // Helper Functions
    const getSubjectColor = (index) => {
        const colors = ['#b25d31', '#5d9b42', '#4285f4', '#aa46bb', '#f4b400', '#0f9d58'];
        return colors[index % colors.length];
    };

    const convertBlocksToEvents = (blocks, subjects, classrooms) => {
        return blocks.map(block => {
            const subject = subjects.find(s => s.Id === block.SubjectFK);
            const classroom = classrooms.find(c => c.Id === block.ClassroomFK);

            // Format date for FullCalendar
            const date = new Date(block.Date || schedule.StartDate).toISOString().split('T')[0];

            return {
                id: block.Id,
                title: classroom
                    ? `${subject.Name} - ${classroom.Name}`
                    : `${subject.Name} (Sem sala)`,
                start: `${date}T${block.StartHour}`,
                end: `${date}T${block.EndHour}`,
                backgroundColor: subject.color,
                extendedProps: {
                    subjectId: subject.Id,
                    classroomId: classroom?.Id || '',
                    duration: calculateDuration(block.StartHour, block.EndHour),
                    scheduleFK: block.ScheduleFK
                }
            };
        });
    };

    const calculateDuration = (startTime, endTime) => {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        return (end - start) / (1000 * 60 * 60); // Convert to hours
    };

    const updateAllocatedHours = (subjects, blocks) => {
        const updatedSubjects = [...subjects];

        blocks.forEach(block => {
            const subjectIndex = updatedSubjects.findIndex(s => s.Id === block.SubjectFK);
            if (subjectIndex >= 0) {
                const duration = calculateDuration(block.StartHour, block.EndHour);
                updatedSubjects[subjectIndex].allocatedHours += duration;
            }
        });

        setSubjects(updatedSubjects);
    };

    // Handle date selection in calendar
    const handleDateSelect = async (selectInfo) => {
        if (!currentSubject) {
            setMessage({ text: 'Selecione uma cadeira antes de adicionar ao horário', type: 'warning' });
            selectInfo.view.calendar.unselect();
            return;
        }

        // Calculate duration in hours
        const start = new Date(selectInfo.start);
        const end = new Date(selectInfo.end);
        const durationHours = (end - start) / (1000 * 60 * 60);

        // Check for overlaps with existing blocks
        const hasOverlap = blocks.some(block => {
            const blockStart = new Date(block.start);
            const blockEnd = new Date(block.end);
            return (start < blockEnd && end > blockStart);
        });

        if (hasOverlap) {
            setMessage({ text: 'Já existe uma aula neste horário', type: 'danger' });
            selectInfo.view.calendar.unselect();
            return;
        }

        try {
            const selectedSubject = subjects.find(s => s.Id === currentSubject);

            // Prepare block data for API
            const blockData = {
                subjectId: currentSubject,
                startHour: start.toTimeString().substring(0, 8), // Format: HH:MM:SS
                endHour: end.toTimeString().substring(0, 8)
            };

            // Save to database
            const response = await api.saveBlock(schedule.Id, blockData);
            const newBlockId = response.data.id || Date.now(); // Use API response ID or fallback

            // Create event for calendar
            const newEvent = {
                id: newBlockId,
                title: `${selectedSubject.Name} (Sem sala)`,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                backgroundColor: selectedSubject.color,
                extendedProps: {
                    subjectId: currentSubject,
                    classroomId: '',
                    duration: durationHours,
                    scheduleFK: schedule.Id
                }
            };

            setBlocks([...blocks, newEvent]);

            // Update allocated hours
            setSubjects(subjects.map(subject =>
                subject.Id === currentSubject
                    ? { ...subject, allocatedHours: subject.allocatedHours + durationHours }
                    : subject
            ));

            setMessage({ text: `Aula de ${selectedSubject.Name} adicionada. Clique na aula para selecionar uma sala.`, type: 'success' });
        } catch (error) {
            setMessage({ text: `Erro ao adicionar aula: ${error.message}`, type: 'danger' });
        }

        selectInfo.view.calendar.unselect();
    };

    // Handle event click to open room selection modal
    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        setSelectedBlock({
            id: event.id,
            start: event.start,
            end: event.end,
            extendedProps: event.extendedProps
        });
        setSelectedClassroom(event.extendedProps.classroomId || '');
        setShowRoomModal(true);
    };

    // Handle room assignment
    const handleRoomAssign = async () => {
        if (!selectedClassroom) {
            setMessage({ text: 'Selecione uma sala para a aula', type: 'warning' });
            return;
        }

        // Check for room conflicts
        const blockStart = new Date(selectedBlock.start);
        const blockEnd = new Date(selectedBlock.end);

        const roomConflict = blocks.some(block => {
            if (parseInt(block.id) === parseInt(selectedBlock.id)) return false;

            const start = new Date(block.start);
            const end = new Date(block.end);
            return (
                block.extendedProps.classroomId === selectedClassroom &&
                start < blockEnd &&
                end > blockStart
            );
        });

        if (roomConflict) {
            setMessage({ text: 'Esta sala já está ocupada neste horário', type: 'danger' });
            return;
        }

        try {
            // Update block in database
            await api.updateBlock(selectedBlock.id, {
                classroomId: selectedClassroom
            });

            // Update local state
            const selectedSubject = subjects.find(s => s.Id === selectedBlock.extendedProps.subjectId);
            const classroomName = classrooms.find(c => c.Id === parseInt(selectedClassroom)).Name;

            setBlocks(blocks.map(block => {
                if (parseInt(block.id) === parseInt(selectedBlock.id)) {
                    return {
                        ...block,
                        title: `${selectedSubject.Name} - ${classroomName}`,
                        extendedProps: {
                            ...block.extendedProps,
                            classroomId: selectedClassroom
                        }
                    };
                }
                return block;
            }));

            setShowRoomModal(false);
            setMessage({ text: `Sala atribuída com sucesso!`, type: 'success' });
        } catch (error) {
            setMessage({ text: `Erro ao atribuir sala: ${error.message}`, type: 'danger' });
        }
    };

    // Handle event removal
    const handleEventRemove = async () => {
        try {
            await api.deleteBlock(selectedBlock.id);

            const subjectId = selectedBlock.extendedProps.subjectId;
            const duration = selectedBlock.extendedProps.duration;

            // Update allocated hours
            setSubjects(subjects.map(subject =>
                subject.Id === subjectId
                    ? { ...subject, allocatedHours: Math.max(0, subject.allocatedHours - duration) }
                    : subject
            ));

            setBlocks(blocks.filter(b => parseInt(b.id) !== parseInt(selectedBlock.id)));
            setShowRoomModal(false);
            setMessage({ text: 'Aula removida com sucesso!', type: 'info' });
        } catch (error) {
            setMessage({ text: `Erro ao remover aula: ${error.message}`, type: 'danger' });
        }
    };

    const saveSchedule = () => {
        // Check if all events have rooms assigned
        const blocksWithoutRooms = blocks.filter(block => !block.extendedProps.classroomId);

        if (blocksWithoutRooms.length > 0) {
            setMessage({
                text: 'Todas as aulas devem ter uma sala atribuída antes de guardar o horário',
                type: 'warning'
            });
            return;
        }

        setMessage({ text: 'Horário guardado com sucesso!', type: 'success' });
    };

    function renderEventContent(eventInfo) {
        return (
            <>
                <b>{eventInfo.timeText}</b>
                <i>{eventInfo.event.title}</i>
            </>
        );
    }

    if (loading) {
        return (
            <Container fluid style={iptStyles.mainContainer}>
                <div className="text-center my-5">
                    <h3>A carregar dados do horário...</h3>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid style={iptStyles.mainContainer}>
                <Alert variant="danger">
                    Erro ao carregar dados: {error}
                </Alert>
            </Container>
        );
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
                                {subjects.map(subject => (
                                    <div key={subject.Id} className="mb-3">
                                        <Form.Check
                                            type="radio"
                                            id={`subject-${subject.Id}`}
                                            name="subject"
                                            label={
                                                <span>
                                                    {subject.Name}
                                                    <Badge
                                                        bg={subject.allocatedHours >= subject.TotalHours ? "success" : "warning"}
                                                        className="ms-2"
                                                    >
                                                        {subject.allocatedHours}/{subject.TotalHours}h
                                                    </Badge>
                                                </span>
                                            }
                                            onChange={() => setCurrentSubject(subject.Id)}
                                            checked={currentSubject === subject.Id}
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
                                events={blocks}
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
                    {selectedBlock && (
                        <>
                            <p><strong>Cadeira:</strong> {subjects.find(s => s.Id === selectedBlock.extendedProps.subjectId)?.Name}</p>
                            <p><strong>Horário:</strong> {new Date(selectedBlock.start).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedBlock.end).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}</p>
                            <p><strong>Dia:</strong> {new Date(selectedBlock.start).toLocaleDateString('pt-PT', {weekday: 'long', day: 'numeric', month: 'long'})}</p>

                            <Form.Group className="mb-3">
                                <Form.Label>Sala:</Form.Label>
                                <Form.Select
                                    value={selectedClassroom}
                                    onChange={(e) => setSelectedClassroom(e.target.value)}
                                    style={iptStyles.formControl}
                                >
                                    <option value="">Selecione uma sala</option>
                                    {classrooms.map(classroom => (
                                        <option key={classroom.Id} value={classroom.Id}>{classroom.Name}</option>
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

