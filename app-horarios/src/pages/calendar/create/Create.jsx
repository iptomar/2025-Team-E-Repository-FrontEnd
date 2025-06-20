import { useState, useEffect, useRef, Fragment } from "react";
import { Container, Row, Col, Card, Button, Form, Alert, Badge, OverlayTrigger,Tooltip} from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "react-bootstrap/Modal";
import "./Create.scss";
import { fetchSubjectsWithProfessors } from "../../../api/courseFetcher.js";
import { createEvent } from "../../../api/calendarFetcher.js";
import { useNavigate, useLocation } from "react-router-dom";
import { FULL_ROUTES } from "../../../routes.jsx";
import { fetchClassrooms } from "../../../api/classroomFetcher.js";
import { fetchOverlappingBlocks } from "../../../api/blocksFetcher.js";
import { io } from "socket.io-client";
import {
  FaGraduationCap,
  FaChalkboardTeacher,
  FaCalendarPlus,
  FaCalendarCheck,
} from "react-icons/fa";

/**
 * CalendarCreate Component
 *
 * This component implements a weekly schedule management system that follows
 * the IPT (Instituto Politécnico de Tomar) design style.
 */
export default function CalendarCreate() {
    const navigate = useNavigate();

    //websockets
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io("http://localhost:3001");

        setSocket(newSocket);

        newSocket.on('connect', () => {
        console.log('WebSocket: Cliente conectado -', newSocket.id);
        });

        // Cleanup
        return () => {
        newSocket.disconnect();
        };
    }, []);


 


    // State for courses.jsx and their required hours
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [coursesError, setCoursesError] = useState(null);

    // Course search bar
    const [searchTerm, setSearchTerm] = useState("");

    // State for course pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(2); // Courses per page
    // Calculate the index of the items to be displayed
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const filteredCourses = courses.filter(
        (course) =>
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.professor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const currentCourses = filteredCourses.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);

    // State for calendar events
    const [events, setEvents] = useState([]);

    // State for currently selected course
    const [currentCourse, setCurrentCourse] = useState(null);

    // State for validation messages
    const [message, setMessage] = useState({ text: "", type: "" });

    // State to check if schedule is complete
    const [scheduleComplete, setScheduleComplete] = useState(false);

    // State for room selection modal
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState("");

    // Calendar reference
    const calendarRef = useRef(null);

    const location = useLocation();

    const { scheduleId, scheduleName, startDate, endDate } = location.state;

 const renderWithTooltip = (icon, tooltip, value) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
      <span className="d-flex align-items-center gap-2">
        {icon} {value}
      </span>
    </OverlayTrigger>
  );

    console.log(startDate)
    //fetches classrooms to dorpdown
    useEffect(() => {
        const loadClassrooms = async () => {
            try {
                const response = await fetchClassrooms();
                let classroomsData = [];
                if (Array.isArray(response)) {
                    classroomsData = response;
                } else if (response?.data && Array.isArray(response.data)) {
                    classroomsData = response.data;
                } else if (response?.classrooms && Array.isArray(response.classrooms)) {
                    classroomsData = response.classrooms;
                }

                // Transform room objects to use lowercase properties
                const transformedRooms = classroomsData.map(room => ({
                    id: room.Id,
                    name: room.Name,
                }));

                setRooms(transformedRooms);
                setLoadingRooms(false);
            } catch (err) {
                setLoadingRooms(false);
                console.error("Failed to load classrooms:", err);
                setRooms([]);
            }
        };
        loadClassrooms();
    }, []);

    useEffect(() => {
    const loadCourses = async () => {
        setLoadingCourses(true);
        setCoursesError(null);
        try {
            const curricularYear = location.state?.curricularYear;
            const data = await fetchSubjectsWithProfessors(curricularYear);
            console.log("teste" , curricularYear);

            const colorPalette = [
                "#b25d31",
                "#5d9b42",
                "#4285f4",
                "#aa46bb",
                "#f4b400",
            ];
            const transformed = data.map((subject, index) => ({
                id: subject.Id,
                name: subject.Subject,
                professor: subject.Professor,
                allocatedHours: 0,
                type: subject.Tipologia,
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
}, [location.state?.curricularYear]); // 👈 depende do ano curricular

    // Check if the schedule is complete
    useEffect(() => {
        const hasEvents = events.length > 0;
        const allEventsHaveRooms = events.every(
            (event) => event.extendedProps.room && event.extendedProps.room !== ""
        );

        setScheduleComplete(hasEvents && allEventsHaveRooms);
    }, [events]);

    // Handle date selection in calendar
    const handleDateSelect = (selectInfo) => {
        if (!currentCourse) {
            setMessage({
                text: "Selecione uma cadeira antes de adicionar ao horário",
                type: "warning",
            });
            selectInfo.view.calendar.unselect();
            return;
        }
        if (selectInfo.start.getDate() !== selectInfo.end.getDate()) {
            setMessage({
                text: "Não é permitido criar aulas que atravessem vários dias.",
                type: "danger",
            });
            selectInfo.view.calendar.unselect();
            return;
        }

        // Calculate duration in hours
        const start = new Date(selectInfo.start);
        const end = new Date(selectInfo.end);
        const durationHours = (end - start) / (1000 * 60 * 60);

        // Check for overlaps with existing events
        const hasOverlap = events.some((event) => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return start < eventEnd && end > eventStart;
        });

        if (hasOverlap) {
            setMessage({ text: "Já existe uma aula neste horário", type: "danger" });
            selectInfo.view.calendar.unselect();
            return;
        }

        const selectedCourse = courses.find((c) => c.id === currentCourse);
        const newEvent = {
            id: Date.now(),
            title: `${selectedCourse.name} (Sem sala) - ${selectedCourse.professor}`,
            start: selectInfo.startStr,
            end: selectInfo.endStr,
            backgroundColor: selectedCourse.color,
            extendedProps: {
                courseId: currentCourse,
                subjectId: selectedCourse.id,
                room: "",
                professor: selectedCourse.professor,
                duration: durationHours,
            },
        };

        setEvents([...events, newEvent]);

        // Update allocated hours
        setCourses(
            courses.map((course) =>
                course.id === currentCourse
                    ? { ...course, allocatedHours: course.allocatedHours + durationHours }
                    : course
            )
        );
        // Automatically open room selection modal
        setSelectedEvent(newEvent);
        setSelectedRoom("");
        setShowRoomModal(true);
        selectInfo.view.calendar.unselect();
        selectInfo.view.calendar.unselect();
    };

    // Handle event click to open room selection modal
    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        setSelectedEvent(event);
        setSelectedRoom(event.extendedProps.room || "");
        setShowRoomModal(true);
    };

    // Handle room assignment
    const handleRoomAssign = async () => {
        // Checks if there are rooms available
        if (!Array.isArray(rooms) || rooms.length === 0) {
            setMessage({ text: "Dados de sala indisponíveis", type: "danger" });
            return;
        }

        //Checks if a room is selected
        if (!selectedRoom) {
            setMessage({ text: "Selecione uma sala para a aula", type: "warning" });
            return;
        }

        // Info to send to block
        const selectedCourse = courses.find(
            (c) => c.id === selectedEvent.extendedProps.courseId
        );
        const room = rooms.find(r => r.id === parseInt(selectedRoom));
        const roomName = room ? room.name : "Sala desconhecida";
        const professor = selectedCourse.professor;
        const eventStart = new Date(selectedEvent.start);
        const eventEnd = new Date(selectedEvent.end);
        
        // Data to send to buffer
        const dataToBuffer = {
            roomId: room.id,
            professorName: professor,
            eventStart: eventStart,
            eventEnd: eventEnd
        };

        // 🟡 Aguarda confirmação do backend
        const isSalaDisponivel = await new Promise((resolve) => {
            socket.emit("adicionarSala", dataToBuffer);

            socket.once("respostaBuffer", (resposta) => {
                if (resposta.status === "ok") {
                    resolve(true);
                } else {
                    alert("Esta sala já está ocupada neste horário");
                    setSelectedRoom(""); // limpa a seleção se quiseres
                    resolve(false);
                }
            });
        });

        if (!isSalaDisponivel) return;

        //todo. aqui: lOGICA DE IR BUSCAR Á BASE DE DADOS!!
        console.log(new Date(startDate).toISOString());
        //1o ter uma lista
        const overlapingBlocks = await fetchOverlappingBlocks({
            start: new Date(startDate).toISOString(),  
            end: new Date(endDate).toISOString()
        });

        console.log(overlapingBlocks);

        // Check if the selected room is already booked for this time slot
        const roomConflict = events.some((event) => {
            if (parseInt(event.id) === parseInt(selectedEvent.id)) return false;

            const start = new Date(event.start);
            const end = new Date(event.end);
            return (
                event.extendedProps.room === selectedRoom &&
                start < eventEnd &&
                end > eventStart    
            );
        });

        // If room is ocuppied 
        if (roomConflict) {
            setMessage({
                text: "Esta sala já está ocupada neste horário",
                type: "danger",
            });
            return;
        }

        // Case if everything is ok
        setEvents(
            events.map((event) => {
                if (parseInt(event.id) === parseInt(selectedEvent.id)) {
                    return {
                        ...event,
                        title: `${selectedCourse.name} - ${roomName} - ${professor}`,
                        extendedProps: {
                            ...event.extendedProps,
                            room: selectedRoom,
                        },
                    };
                }
                return event;
            })
        );

        // Closes the model 
        setShowRoomModal(false);
        setMessage({ text: `Sala atribuída com sucesso!`, type: "success" });
    };

    // Handle event removal
    const handleEventRemove = () => {
        const courseId = selectedEvent.extendedProps.courseId;
        const duration = selectedEvent.extendedProps.duration;

        // Update allocated hours
        setCourses(
            courses.map((course) =>
                course.id === courseId
                    ? {
                        ...course,
                        allocatedHours: Math.max(0, course.allocatedHours - duration),
                    }
                    : course
            )
        );

        // Remove room from buffer
        socket.emit("removerSala", {
            roomId: parseInt(selectedEvent.extendedProps.room),
            eventStart: new Date(selectedEvent.start).toISOString(), 
            eventEnd: new Date(selectedEvent.end).toISOString()    
        });


        setEvents(
            events.filter((e) => parseInt(e.id) !== parseInt(selectedEvent.id))
        );
        setShowRoomModal(false);
        setMessage({ text: "Aula removida com sucesso!", type: "info" });
    };

    const saveSchedule = async () => {
        if (events.length === 0) {
            setMessage({
                text: "O horário está vazio. Adicione aulas antes de guardar.",
                type: "warning",
            });
            return;
        }

        const eventsWithoutRooms = events.filter(
            (event) => !event.extendedProps.room
        );

        if (eventsWithoutRooms.length > 0) {
            setMessage({
                text: "Todas as aulas devem ter uma sala atribuída antes de guardar o horário",
                type: "warning",
            });
            return;
        }

        //para receber o token
        const token = localStorage.getItem("token");
        //envia toda a informação de quem está a criar este horario
        const user = JSON.parse(localStorage.getItem("user")); // transforma de string para objeto

        const scheduleList = events.map((event) => ({
            subjectId: event.extendedProps.courseId,
            scheduleId: scheduleId,
            classroomId: event.extendedProps.room,
            startHour: new Date(event.start).toISOString().replace('T', ' ').substring(0, 19),
            endHour: new Date(event.end).toISOString().replace('T', ' ').substring(0, 19),
            createdBy: user.email,
            dayOfWeek: new Date(event.start).getDay()
        }));

        console.log(scheduleList);

        //Remove from the buffer the blocks of the schedule
        // When a schedule is saved, we need to remove the blocks from the buffer 
        events.forEach(event => { // For every event in the schedule
            // Emit the event to remove the room from the buffer
            socket.emit("removerSala", {
                roomId: parseInt(event.extendedProps.room),
                eventStart: new Date(event.start).toISOString(), // Full ISO string
                eventEnd: new Date(event.end).toISOString()      // Full ISO string
            });
        });


        console.log("Horário guardado:", scheduleList);

        try {
            for (const scheduleData of scheduleList) {
                await createEvent(scheduleId, token, scheduleData);
                navigate(FULL_ROUTES.HOME);
            }

            setMessage({ text: "Horário guardado com sucesso!", type: "success" });
            alert("Horário guardado com sucesso!");
        } catch (error) {
            setMessage({ text: error.message, type: "error" });
        }
    };

    function renderEventContent(eventInfo) {
        return (
            <>
                <b>{eventInfo.timeText}</b>
                <i>{eventInfo.event.title}</i>
            </>
        );
    }

    return (
       <Container fluid className="mainContainer">
      <h2 className="headerText text-center">Plataforma de Gestão de Horários</h2>

      <div className="schedule-info mb-4 p-3 bg-light rounded text-center">
        <h4 className="mb-1">{scheduleName}</h4>
        <p className="mb-0">Horário Semanal – Criação</p>
        <div className="d-flex justify-content-center flex-wrap gap-4 mt-2 fw-medium">
          {location.state?.curricularYear &&
            renderWithTooltip(
              <FaGraduationCap className="icon-primary" />, "Ano Curricular", location.state.curricularYear
            )}
          {location.state?.class &&
            renderWithTooltip(
              <FaChalkboardTeacher className="icon-primary" />, "Turma", location.state.class
            )}
          {renderWithTooltip(
            <FaCalendarPlus className="icon-primary" />, "Data de início", new Date(startDate).toLocaleDateString("pt-PT")
          )}
          {renderWithTooltip(
            <FaCalendarCheck className="icon-primary" />, "Data de fim", new Date(endDate).toLocaleDateString("pt-PT")
          )}
        </div>
      </div>


            {message.text && (
                <Alert
                    variant={message.type}
                    onClose={() => setMessage({ text: "", type: "" })}
                    dismissible
                >
                    {message.text}
                </Alert>
            )}

            <Row>
                <Col md={3}>
                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Cadeiras</Card.Header>
                        <Card.Body>
                            {/* Search Bar */}
                            <Form.Group className="mb-3 position-relative">
                                <i className="bi bi-search position-absolute align-middle search-icon"></i>
                                <Form.Control
                                    type="text"
                                    placeholder="Pesquisar cadeira ou professor..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="search-input search-input-custom"
                                />
                                {searchTerm && (
                                    <Button
                                        variant="link"
                                        className="position-absolute clear-search-button"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <i className="bi bi-x align-middle"></i>
                                    </Button>
                                )}
                            </Form.Group>

                            {/* Course Radio Buttons */}
                            {!loadingCourses &&
                                !coursesError &&
                                currentCourses.map((course) => (
                                    <div key={course.id} className="mb-3">
                                        <Form.Check
                                            type="radio"
                                            id={`course-${course.id}`}
                                            name="course"
                                            label={
                                                <span>
                                                    {course.name}{" "}
                                                    <span className="tipology-badge">
                                                        ({course.tipologia === 'Teorico-Pratica' ? 'TP' : course.tipologia === 'Pratica' ? 'P' : 'T'})
                                                    </span>
                                                    <br />
                                                    <span className="professor-badge">
                                                        ({course.professor})
                                                    </span>
                                                    <Badge
                                                        bg={
                                                            course.allocatedHours >= course.requiredHours
                                                                ? "success"
                                                                : "warning"
                                                        }
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

                            {/* Responsive Pagination */}
                            {!loadingCourses &&
                                !coursesError &&
                                courses.length > itemsPerPage && (
                                    <div className="pagination-simple d-flex justify-content-center align-items-center mt-3">
                                        {/* Previous Button */}
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() =>
                                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                                            }
                                            disabled={currentPage === 1}
                                            className="pagination-btn"
                                        >
                                            &laquo;
                                        </Button>

                                        {/* Page 1 */}
                                        <Button
                                            variant={currentPage === 1 ? "primary" : "outline-secondary"}
                                            size="sm"
                                            className="mx-1 pagination-btn"
                                            onClick={() => setCurrentPage(1)}
                                        >
                                            1
                                        </Button>

                                        {/* Page 2 (if exists) */}
                                        {totalPages >= 2 && (
                                            <Button
                                                variant={currentPage === 2 ? "primary" : "outline-secondary"}
                                                size="sm"
                                                className="mx-1 pagination-btn"
                                                onClick={() => setCurrentPage(2)}
                                            >
                                                2
                                            </Button>
                                        )}

                                        {/* Current page indicator */}
                                        <span className="pagination-info">
                                            Pg. {currentPage} de {totalPages}
                                        </span>

                                        {/* Page 3 (if exists) */}
                                        {totalPages >= 3 && (
                                            <Button
                                                variant={currentPage === 3 ? "primary" : "outline-secondary"}
                                                size="sm"
                                                className="mx-1 pagination-btn"
                                                onClick={() => setCurrentPage(3)}
                                            >
                                                3
                                            </Button>
                                        )}

                                        {/* Next Button */}
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() =>
                                                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                            }
                                            disabled={currentPage === totalPages}
                                            className="pagination-btn"
                                        >
                                            &raquo;
                                        </Button>
                                    </div>
                                )}
                        </Card.Body>
                    </Card>

                    {/* Instructions */}

                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Instruções</Card.Header>
                        <Card.Body>
                            <ol className="ps-3">
                                <li className="mb-2">Selecione uma cadeira</li>
                                <li className="mb-2">
                                    Clique e arraste no calendário para adicionar uma aula
                                </li>
                                <li className="mb-2">
                                    Clique na aula para selecionar uma sala
                                </li>
                                <li className="mb-2">
                                    Todas as cadeiras devem ter suas horas alocadas
                                </li>
                                <li className="mb-2">
                                    Todas as aulas devem ter uma sala atribuída
                                </li>
                            </ol>
                        </Card.Body>
                    </Card>
                </Col>
                {/* Calendar */}

                <Col md={9}>
                    <Card className="card">
                        <Card.Body>
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[timeGridPlugin, interactionPlugin]}
                                initialView="timeGridWeek"
                                headerToolbar={false}
                                titleFormat={{ weekday: "long" }}
                                dayHeaderFormat={{ weekday: "short" }}
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
                                selectAllow={(selectInfo) => {
                                    return (
                                        selectInfo.start.getDate() === selectInfo.end.getDate()
                                    );
                                }}
                                eventClick={handleEventClick}
                                events={events}
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
                                eventContent={renderEventContent}
                            />
                        </Card.Body>
                    </Card>
                    {/* Schedule State */}
                    <Row className="mt-4">
                        <Col md={12}>
                            <Card className="mb-4 card">
                                <Card.Header className="cardHeader">
                                    Estado do Horário
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={9}>
                                            {scheduleComplete ? (
                                                <Alert variant="success">
                                                    Todas as horas foram alocadas e todas as aulas têm
                                                    salas atribuídas! O horário está completo.
                                                </Alert>
                                            ) : (
                                                <Alert variant="warning">
                                                    Ainda faltam horas a serem alocadas ou aulas sem salas
                                                    atribuídas.
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
                            <p>
                                <strong>Cadeira:</strong>{" "}
                                {
                                    courses.find(
                                        (c) => c.id === selectedEvent.extendedProps.courseId
                                    ).name
                                }
                            </p>
                            <p>
                                <strong>Professor:</strong>{" "}
                                {
                                    courses.find(
                                        (c) => c.id === selectedEvent.extendedProps.courseId
                                    ).professor
                                }
                            </p>
                            <p>
                                <strong>Horário:</strong>{" "}
                                {new Date(selectedEvent.start).toLocaleTimeString("pt-PT", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {new Date(selectedEvent.end).toLocaleTimeString("pt-PT", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                            <p>
                                <strong>Dia:</strong>{" "}
                                {new Date(selectedEvent.start).toLocaleDateString("pt-PT", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                })}
                            </p>

                            <Form.Select
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className="formControl"
                            >
                                <option value="">Selecione uma sala</option>
                                {loadingRooms ? (
                                    <option disabled>Carregando salas...</option>
                                ) : rooms.length === 0 ? (
                                    <option disabled>Nenhuma sala disponível</option>
                                ) : (
                                    rooms.map(room => (
                                        <option key={room.id} value={room.id}>
                                            {room.name}
                                        </option>
                                    ))
                                )}
                            </Form.Select>
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
