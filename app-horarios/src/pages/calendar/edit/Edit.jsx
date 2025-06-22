import React, { useState, useEffect, useRef } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Alert,
    Spinner,
    OverlayTrigger,
    Tooltip,
    Form,
    Modal,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
    FaCalendarAlt,
    FaCalendarPlus,
    FaCalendarCheck,
    FaGraduationCap,
    FaChalkboardTeacher,
    FaEdit,
    FaTrash,
} from "react-icons/fa";
import {fetchScheduleById, updateEvent, deleteEvent, createEvent} from "../../../api/calendarFetcher";
import { fetchClassrooms } from "../../../api/classroomFetcher";
import { fetchSubjectsWithProfessors } from "../../../api/courseFetcher";
import { io } from "socket.io-client";
import "./Edit.scss";
import {toLocalISOString} from "../../../lib/utlity/utility.js";

/* ---------------------------------------------------- */
/*  Helpers                                             */
/* ---------------------------------------------------- */
const tipologyColor = (t) =>
    t === "Teorico"
        ? "#b25d31"
        : t === "Pratica"
            ? "#5d9b42"
            : t === "Teorico-Pratica"
                ? "#4285f4"
                : "#aa46bb";

const weekStartOf = (d) => {
    const date = new Date(d);
    const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
};

const withTooltip = (icon, tip, value) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tip}</Tooltip>} key={tip}>
    <span className="d-flex align-items-center gap-2">
      {icon} {value}
    </span>
    </OverlayTrigger>
);

/* ---------------------------------------------------- */
/*  Component                                           */
/* ---------------------------------------------------- */
export default function CalendarEdit() {
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    const calendarRef = useRef(null);
    const user = JSON.parse(localStorage.getItem("user")) || {};

    // State management
    const [schedule, setSchedule] = useState(null);
    const [events, setEvents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState({ text: "", type: "" });

    // Course selection
    const [currentCourse, setCurrentCourse] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(3);

    // Modal states
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState("");
    const [isEditingEvent, setIsEditingEvent] = useState(false);

    // WebSocket and conflict detection
    const [socket, setSocket] = useState(null);
    const [eventosConflito, setEventosConflito] = useState([]);
    const [conflitosSala, setConflitosSala] = useState(null);
    const [conflitosProfessor, setConflitosProfessor] = useState(null);

    const [originalEvents, setOriginalEvents] = useState([]); // Store original state
    const [deletedEvents, setDeletedEvents] = useState([]); // Track deleted events
    const roomUpdates = useRef({});

    useEffect(() => {
        console.log("Events state updated:", events);
    }, [events]);


    // Initialize WebSocket
    useEffect(() => {
        const newSocket = io("http://localhost:3001");
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("WebSocket: Cliente conectado -", newSocket.id);
            if (user?.email) {
                newSocket.emit('limparBufferPorEmail', { email: user.email });
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Reset conflicts when modal opens or room changes
    useEffect(() => {
        setConflitosSala(null);
        setConflitosProfessor(null);
        setMessage({ text: "", type: "" });
    }, [selectedEvent, selectedRoom]);

    // Check conflicts after receiving both results
    useEffect(() => {
        if (conflitosSala === null || conflitosProfessor === null) return;

        const hasSalaConflict = conflitosSala.some((b) => b.IsConflict);
        const hasProfConflict = conflitosProfessor.some((b) => b.IsConflict);

        if (hasSalaConflict) {
            setMessage({
                text: "Esta sala já tem conflitos neste horário!",
                type: "danger",
            });
            setShowRoomModal(false);
            return;
        }

        if (hasProfConflict) {
            setMessage({
                text: "Este professor já tem aulas nesse horário!",
                type: "danger",
            });
            setShowRoomModal(false);
            return;
        }

        setMessage({ text: "", type: "" });
    }, [conflitosSala, conflitosProfessor]);

    // Fetch initial data
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                const [scheduleData, classrooms, subjects] = await Promise.all([
                    fetchScheduleById(scheduleId, token),
                    fetchClassrooms(),
                    fetchSubjectsWithProfessors()
                ]);

                console.log("=== RAW SUBJECTS DATA ===");
                console.log("Subjects received:", subjects);
                console.log("Number of subjects:", subjects.length);

                // Check each subject individually
                subjects.forEach((subject, index) => {
                    console.log(`Subject ${index}:`, {
                        Id: subject.Id,
                        Subject: subject.Subject,
                        Professor: subject.Professor,
                        Tipologia: subject.Tipologia,
                        professorId: subject.professorId
                    });
                });

                setSchedule(scheduleData);
                setRooms(classrooms.map(room => ({ id: room.Id, name: room.Name })));

                // Transform subjects to courses format
                const colorPalette = ["#b25d31", "#5d9b42", "#4285f4", "#aa46bb", "#f4b400"];
                const transformedCourses = subjects.map((subject, index) => {
                    const course = {
                        id: subject.Id,
                        subjectId: subject.IdSubject,
                        name: subject.Subject,
                        professorId: subject.professorId,
                        professor: subject.Professor,
                        type: subject.Tipologia,
                        color: colorPalette[index % colorPalette.length],
                    };

                    console.log(`Transformed course ${index}:`, course);

                    // Check for undefined values
                    if (!course.name) {
                        console.warn(`Course ${index} has undefined name:`, subject);
                    }
                    if (!course.professor) {
                        console.warn(`Course ${index} has undefined professor:`, subject);
                    }

                    return course;
                });

                console.log("=== FINAL TRANSFORMED COURSES ===");
                console.log("Transformed courses:", transformedCourses);
                setCourses(transformedCourses);

                // Convert blocks to events
                const startWeek = weekStartOf(new Date());
                const evts = scheduleData.blocks?.map((b) => {
                    const subj = subjects.find((s) => s.Id === b.SubjectFK);
                    const room = classrooms.find((c) => c.Id === b.ClassroomFK);

                    console.log("=== BLOCK TO EVENT MAPPING DEBUG ===");
                    console.log("Block SubjectFK:", b.SubjectFK);
                    console.log("Found subject:", subj);
                    console.log("Subject ID in courses list:", subj?.Id);

                    const dow = b.DayOfWeek ?? 1;
                    const baseDate = new Date(startWeek);
                    baseDate.setDate(startWeek.getDate() + (dow - 1));

                    const [sh, sm] = b.StartHour.split(":");
                    const [eh, em] = b.EndHour.split(":");

                    const start = new Date(baseDate);
                    start.setHours(+sh, +sm, 0, 0);
                    const end = new Date(baseDate);
                    end.setHours(+eh, +em, 0, 0);

                    return {
                        id: b.Id,
                        title: `${b.SubjectName} - ${b.ClassroomName || room?.Name || "Sem sala"} - ${subj?.Professor || "N/A"}`,
                        start,
                        end,
                        backgroundColor: tipologyColor(subj?.Tipologia),
                        borderColor: tipologyColor(subj?.Tipologia),
                        extendedProps: {
                            blockId: b.Id,
                            subjectId: b.SubjectFK,
                            professor: subj?.Professor || "N/A",
                            classroom: b.ClassroomName || room?.Name || "Sem sala",
                            classroomId: b.ClassroomFK,
                            tipologia: subj?.Tipologia || "N/A",
                            courseId: subj?.Id || null, // ✅ FIXED: Use the subject's ID from the courses list
                            room: b.ClassroomFK?.toString() || "",
                            isOriginal: true,
                        },
                    };
                }) ?? [];

                setEvents(evts);
                setOriginalEvents(JSON.parse(JSON.stringify(evts))); // Deep copy for comparison

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };


        fetchAll();
    }, [scheduleId]);

    // Course filtering and pagination
    const filteredCourses = courses.filter(
        (course) =>
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.professor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

    // Handle date selection for new events
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

        // Check for overlaps
        const start = new Date(selectInfo.start);
        const end = new Date(selectInfo.end);
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
            id: `new-${Date.now()}`,
            isNew: true,
            title: `${selectedCourse.name} (Sem sala) - ${selectedCourse.professor}`,
            start: selectInfo.startStr,
            end: selectInfo.endStr,
            backgroundColor: selectedCourse.color,
            extendedProps: {
                courseId: currentCourse,
                subjectId: selectedCourse.subjectId,
                classroomId: "",
                professor: selectedCourse.professor,
                tipologia: selectedCourse.type,
                room: "",
            },
        };
        console.log(newEvent);

        setSelectedEvent(newEvent);
        setSelectedRoom("");
        setIsEditingEvent(false);
        setShowRoomModal(true);
        selectInfo.view.calendar.unselect();
    };

    // Handle event click for editing
    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;

        console.log("=== EVENT CLICK DEBUG ===");
        console.log("Clicked event:", event);
        console.log("Event courseId:", event.extendedProps.courseId);
        console.log("Event subjectId:", event.extendedProps.subjectId);
        console.log("Available courses:", courses);
        console.log("Available course IDs:", courses.map(c => c.id));

        const selectedCourse = courses.find((c) => c.id === event.extendedProps.courseId);
        console.log("Found course:", selectedCourse);

        if (!selectedCourse) {
            console.warn("Course not found! This will show as N/A");
        }

        setSelectedEvent(event);
        setSelectedRoom(event.extendedProps.room || event.extendedProps.classroomId || "");
        setIsEditingEvent(true);
        setShowRoomModal(true);
    };


    // Handle room assignment with buffer verification
    const handleRoomAssign = async () => {
        console.log("=== HANDLE ROOM ASSIGN START ===");
        console.log("Selected room:", selectedRoom);
        console.log("Selected event:", selectedEvent);

        if (!selectedRoom) {
            console.log("ERROR: No room selected");
            setMessage({ text: "Selecione uma sala para a aula", type: "warning" });
            return;
        }

        const room = rooms.find((r) => r.id === parseInt(selectedRoom));
        const roomName = room ? room.name : "Sala desconhecida";
        console.log("Room found:", room);
        console.log("Room name:", roomName);

        const selectedCourse = courses.find((c) => c.id === selectedEvent.extendedProps.courseId);
        console.log("Selected course:", selectedCourse);
        console.log("Course ID from event:", selectedEvent.extendedProps.courseId);

        if (!selectedCourse) {
            console.log("ERROR: Course not found");
            setMessage({ text: "Erro: Cadeira não encontrada", type: "danger" });
            return;
        }

        const eventStart = new Date(selectedEvent.start);
        const eventEnd = new Date(selectedEvent.end);
        const dayOfWeek = eventStart.getDay() === 0 ? 7 : eventStart.getDay();

        // Get the current event's blockId for exclusion
        const currentBlockId = selectedEvent.extendedProps?.blockId || null;


        console.log("Event start:", eventStart);
        console.log("Event end:", eventEnd);
        console.log("Day of week:", dayOfWeek);
        console.log("Event start ISO:", eventStart.toISOString());
        console.log("Event end ISO:", eventEnd.toISOString());

        // Verify room conflicts using WebSocket
        const roomConflictData = {
            roomId: room.id,
            eventStart: toLocalISOString(eventStart),
            eventEnd: toLocalISOString(eventEnd),
            scheduleStartDate: new Date(schedule.StartDate).toISOString(),
            scheduleEndDate: new Date(schedule.EndDate).toISOString(),
            excludeBlockId: currentBlockId,

        };

        console.log("=== EMITTING ROOM CONFLICT CHECK ===");
        console.log("Room conflict data:", roomConflictData);

        socket.emit("verificarConflitosSala", roomConflictData);

        socket.once("respostaConflitosSala", async ({ blocos }) => {
            console.log("=== ROOM CONFLICT RESPONSE ===");
            console.log("Blocos received:", blocos);

            const calendarApi = calendarRef.current?.getApi();
            const baseDate = calendarApi ? new Date(calendarApi.view.currentStart) : new Date();
            const baseMonday = new Date(baseDate);
            baseMonday.setDate(baseMonday.getDate() - baseMonday.getDay() + 1);

            console.log("Calendar API:", calendarApi);
            console.log("Base date:", baseDate);
            console.log("Base Monday:", baseMonday);

            const conflitos = blocos.map((bloco, idx) => {
                console.log(`Processing bloco ${idx}:`, bloco);

                const dayOffset = bloco.DayOfWeek ? bloco.DayOfWeek - 1 : 0;
                const [startH, startM] = bloco.StartHour.split(":");
                const [endH, endM] = bloco.EndHour.split(":");

                const start = new Date(baseMonday);
                start.setDate(baseMonday.getDate() + dayOffset);
                start.setHours(+startH, +startM, 0, 0);

                const end = new Date(baseMonday);
                end.setDate(baseMonday.getDate() + dayOffset);
                end.setHours(+endH, +endM, 0, 0);

                const isConflict = bloco.IsConflict;

                console.log(`Bloco ${idx} - Day offset: ${dayOffset}, Start: ${start}, End: ${end}, IsConflict: ${isConflict}`);

                return {
                    id: `conflito-${idx}`,
                    title: isConflict ? "Conflito" : "Ocupado",
                    start,
                    end,
                    backgroundColor: isConflict ? "rgba(255, 0, 0, 0.5)" : "rgba(128, 128, 128, 0.3)",
                    borderColor: isConflict ? "darkred" : "gray",
                    textColor: "white",
                    editable: false,
                    eventDisplay: "block",
                    classNames: [isConflict ? "evento-conflito" : "evento-ocupado"],
                    excludeBlockId: currentBlockId,

                };
            });

            console.log("Processed conflicts:", conflitos);
            setEventosConflito(conflitos);

            const hasRoomConflict = conflitos.some(c => c.title === "Conflito");
            console.log("Has room conflict:", hasRoomConflict);

            if (hasRoomConflict) {
                console.log("ROOM CONFLICT DETECTED - Stopping process");
                setMessage({
                    text: "Esta sala já tem conflitos neste horário!",
                    type: "danger",
                });
                setShowRoomModal(false);
                return;
            }

            // Check professor conflicts
            const professorConflictData = {
                professorId: selectedCourse.professorId,
                eventStart: toLocalISOString(eventStart),
                eventEnd: toLocalISOString(eventEnd),
                scheduleStartDate: new Date(schedule.StartDate).toISOString(),
                scheduleEndDate: new Date(schedule.EndDate).toISOString(),
                excludeBlockId: currentBlockId,
            };

            console.log("=== EMITTING PROFESSOR CONFLICT CHECK ===");
            console.log("Professor conflict data:", professorConflictData);

            socket.emit("verificarConflitosProfessor", professorConflictData);

            socket.once("respostaConflitosProfessor", ({ blocos }) => {
                console.log("=== PROFESSOR CONFLICT RESPONSE ===");
                console.log("Professor blocos received:", blocos);

                const conflitosProfessor = blocos.map((bloco, idx) => {
                    console.log(`Processing professor bloco ${idx}:`, bloco);

                    const dayOffset = bloco.DayOfWeek ? bloco.DayOfWeek - 1 : 0;
                    const [startH, startM] = bloco.StartHour.split(":");
                    const [endH, endM] = bloco.EndHour.split(":");

                    const start = new Date(baseMonday);
                    start.setDate(baseMonday.getDate() + dayOffset);
                    start.setHours(+startH, +startM, 0, 0);

                    const end = new Date(baseMonday);
                    end.setDate(baseMonday.getDate() + dayOffset);
                    end.setHours(+endH, +endM, 0, 0);

                    const isConflict = bloco.IsConflict;

                    console.log(`Professor bloco ${idx} - Day offset: ${dayOffset}, Start: ${start}, End: ${end}, IsConflict: ${isConflict}`);

                    return {
                        id: `conflito-prof-${idx}`,
                        title: isConflict ? "Conflito" : "Ocupado",
                        start,
                        end,
                        backgroundColor: isConflict ? "rgba(255, 0, 0, 0.5)" : "rgba(128, 128, 128, 0.3)",
                        borderColor: isConflict ? "darkred" : "gray",
                        textColor: "white",
                        editable: false,
                        eventDisplay: "block",
                        classNames: [isConflict ? "evento-conflito" : "evento-ocupado"],
                    };
                });

                console.log("Processed professor conflicts:", conflitosProfessor);
                setEventosConflito(prev => {
                    console.log("Previous conflicts:", prev);
                    const newConflicts = [...prev, ...conflitosProfessor];
                    console.log("New conflicts array:", newConflicts);
                    return newConflicts;
                });

                const hasConflictProfessor = blocos.some((b) => b.IsConflict);
                console.log("Has professor conflict:", hasConflictProfessor);

                if (hasConflictProfessor) {
                    console.log("PROFESSOR CONFLICT DETECTED - Stopping process");
                    setMessage({
                        text: "Este professor já tem aulas nesse horário!",
                        type: "danger",
                    });
                    setShowRoomModal(false);
                    return;
                }

                // If no conflicts, proceed with assignment
                const startHour = eventStart.toTimeString().slice(0, 8);
                const endHour = eventEnd.toTimeString().slice(0, 8);
                const dataToBuffer = {
                    roomId: room.id,
                    professorName: selectedCourse.professor,
                    professorId: selectedCourse.professorId,
                    startHour,
                    endHour,
                    dayOfWeek,
                    userEmail: user.email
                };

                console.log("=== NO CONFLICTS - PROCEEDING WITH BUFFER ===");
                console.log("Start hour:", startHour);
                console.log("End hour:", endHour);
                console.log("Data to buffer:", dataToBuffer);
                console.log("User email:", user.email);

                socket.emit("adicionarSala", dataToBuffer);

                socket.once("respostaBuffer", (resposta) => {
                    if (resposta.status === "ok") {
                        // Store the room update in ref
                        roomUpdates.current[selectedEvent.extendedProps.blockId] = {
                            roomId: selectedRoom,
                            roomName: roomName,
                            classroomId: parseInt(selectedRoom)
                        };

                        console.log("Stored room update:", roomUpdates.current);

                        if (selectedEvent.isNew) {
                            // ... existing new event logic
                        } else {
                            // Try to update the visual state (this might not work, but we have backup)
                            setEvents(prevEvents =>
                                prevEvents.map((event) =>
                                    event.extendedProps.blockId === selectedEvent.extendedProps.blockId
                                        ? {
                                            ...event,
                                            title: `${selectedCourse.name} - ${roomName} - ${selectedCourse.professor}`,
                                            extendedProps: {
                                                ...event.extendedProps,
                                                classroomId: parseInt(selectedRoom),
                                                classroom: roomName,
                                                room: selectedRoom.toString(),
                                            },
                                        }
                                        : event
                                )
                            );
                            setMessage({ text: "Aula atualizada com sucesso!", type: "success" });
                        }

                        setShowRoomModal(false);
                    } else {
                        setMessage({ text: resposta.motivo, type: "danger" });
                    }
                });
            });
        });
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

        // If it's an original event, add to deleted list
        if (selectedEvent.extendedProps.blockId && selectedEvent.extendedProps.isOriginal) {
            setDeletedEvents(prev => [...prev, selectedEvent.extendedProps.blockId]);
            console.log("Added to deleted events:", selectedEvent.extendedProps.blockId);
        }

        // Remove from buffer if it has a room
        if (selectedEvent.extendedProps.room) {
            socket.emit("removerSala", {
                roomId: parseInt(selectedEvent.extendedProps.room),
                dayOfWeek:
                    new Date(selectedEvent.start).getDay() === 0
                        ? 7
                        : new Date(selectedEvent.start).getDay(),
                startHour: new Date(selectedEvent.start).toTimeString().slice(0, 8),
                endHour: new Date(selectedEvent.end).toTimeString().slice(0, 8),
                professorName: selectedEvent.extendedProps.professor || "",
            });
        }

        setEvents(
            events.filter((e) => parseInt(e.id) !== parseInt(selectedEvent.id))
        );
        setShowRoomModal(false);
        setMessage({ text: "Aula removida com sucesso!", type: "info" });
    };



    // Save schedule changes
    const saveSchedule = async () => {
        if (events.length === 0) {
            setMessage({
                text: "O horário está vazio. Adicione aulas antes de guardar.",
                type: "warning",
            });
            return;
        }

        const eventsWithoutRooms = events.filter(
            (event) => !event.extendedProps.room && !event.extendedProps.classroomId
        );

        if (eventsWithoutRooms.length > 0) {
            setMessage({
                text: "Todas as aulas devem ter uma sala atribuída antes de guardar o horário",
                type: "warning",
            });
            return;
        }

        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        // Categorize events
        const newEvents = events.filter(event => event.isNew || event.extendedProps.isNew);
        const existingEvents = events.filter(event =>
            !event.isNew &&
            !event.extendedProps.isNew &&
            event.extendedProps.blockId
        );

        // Find updated events by comparing with original
        const updatedEvents = existingEvents.filter(event => {
            const original = originalEvents.find(orig => orig.extendedProps.blockId === event.extendedProps.blockId);
            if (!original) return false;

            // Compare relevant properties
            return (
                original.extendedProps.room !== event.extendedProps.room ||
                original.extendedProps.classroomId !== event.extendedProps.classroomId ||
                original.start !== event.start ||
                original.end !== event.end ||
                original.extendedProps.subjectId !== event.extendedProps.subjectId
            );
        });

        console.log("New events:", newEvents);
        console.log("Updated events:", updatedEvents);
        console.log("Deleted event IDs:", deletedEvents);

        try {
            // Handle new events
            for (const event of newEvents) {
                const eventData = {
                    subjectId: event.extendedProps.subjectId,
                    scheduleId: scheduleId,
                    classroomId: event.extendedProps.room || event.extendedProps.classroomId,
                    startHour: toLocalISOString(new Date(event.start))
                        .replace("T", " ")
                        .substring(0, 19),
                    endHour: toLocalISOString(new Date(event.end))
                        .replace("T", " ")
                        .substring(0, 19),
                    createdBy: user.email,
                    dayOfWeek: new Date(event.start).getDay(),
                };

                await createEvent(scheduleId, token, eventData);
                console.log("Created new event:", eventData);
            }

            // Handle updated events
            console.log("=== SAVE DEBUG ===");
            updatedEvents.forEach((event, index) => {
                const original = originalEvents.find(orig => orig.extendedProps.blockId === event.extendedProps.blockId);
                console.log(`Event ${index} (ID: ${event.id}):`);
                console.log("  Current room:", event.extendedProps.room);
                console.log("  Current classroomId:", event.extendedProps.classroomId);
                console.log("  Current classroom:", event.extendedProps.classroom);
                console.log("  Original room:", original?.extendedProps.room);
                console.log("  Original classroomId:", original?.extendedProps.classroomId);
                console.log("  Original classroom:", original?.extendedProps.classroom);
                console.log("  Title:", event.title);
            });


            for (const event of updatedEvents) {
                const updateData = {
                    subjectId: event.extendedProps.subjectId,
                    classroomId: roomUpdates.current[event.extendedProps.blockId]?.classroomId ||
                        event.extendedProps.room ||
                        event.extendedProps.classroomId,
                    startHour: toLocalISOString(new Date(event.start))
                        .replace("T", " ")
                        .substring(0, 19),
                    endHour: toLocalISOString(new Date(event.end))
                        .replace("T", " ")
                        .substring(0, 19),
                    dayOfWeek: new Date(event.start).getDay(),
                };

                console.log("=== ROOM UPDATE CHECK ===");
                console.log("Block ID:", event.extendedProps.blockId);
                console.log("Room update from ref:", roomUpdates.current[event.extendedProps.blockId]);
                console.log("Final classroomId being sent:", updateData.classroomId);

                console.log("=== FRONTEND UPDATE DEBUG ===");
                console.log("Event being updated:", event);
                console.log("Block ID:", event.extendedProps.blockId);
                console.log("Update data being sent:", updateData);
                console.log("Event start date:", new Date(event.start));
                console.log("Event end date:", new Date(event.end));

                try {
                    await updateEvent(token, event.extendedProps.blockId, updateData);
                    console.log("Successfully updated block with blockId:", event.extendedProps.blockId);
                } catch (error) {
                    console.error("Error updating block:", error);
                    throw new Error(`Erro ao atualizar bloco: ${error.message}`);
                }
            }



            // Handle deleted events
            for (const blockId of deletedEvents) {
                try {
                    await deleteEvent(token, blockId);
                    console.log("Successfully deleted event with blockId:", blockId);
                } catch (error) {
                    console.error("Error deleting event with blockId:", blockId, error);
                    throw new Error(`Erro ao apagar evento ${blockId}: ${error.message}`);
                }
            }


            // Remove all events from buffer
            events.forEach((event) => {
                socket.emit("removerSala", {
                    roomId: parseInt(event.extendedProps.room || event.extendedProps.classroomId),
                    eventStart: toLocalISOString(new Date(event.start)),
                    eventEnd: toLocalISOString(new Date(event.end)),
                });
            });

            setMessage({ text: "Horário atualizado com sucesso!", type: "success" });

            /*
            *setTimeout(() => {
                navigate(`/calendar/${scheduleId}/view`);
            }, 1500);
            * */

        } catch (error) {
            console.error("Erro ao guardar horário:", error);
            setMessage({
                text: `Erro ao guardar horário: ${error.message}`,
                type: "danger"
            });
        }
    };



    // Loading state
    if (loading) {
        return (
            <Container
                fluid
                className="mainContainer d-flex justify-content-center align-items-center"
                style={{ minHeight: 400 }}
            >
                <Spinner animation="border" />
            </Container>
        );
    }

    // Error state
    if (error) {
        return (
            <Container fluid className="mainContainer">
                <Alert variant="danger" className="mt-4">
                    <Alert.Heading>Erro ao carregar horário</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={() => navigate("/calendar")}>
                        Voltar aos Horários
                    </Button>
                </Alert>
            </Container>
        );
    }

    // Statistics
    const stats = {
        total: events.length,
        uniq: new Set(events.map((e) => e.extendedProps.subjectId)).size,
        hours: events
            .reduce((s, e) => {
                const start = new Date(e.start);
                const end = new Date(e.end);
                return s + (end - start) / 3_600_000;
            }, 0)
            .toFixed(1),
    };

    return (
        <Container fluid className="mainContainer">
            <h2 className="headerText text-center">Edição de Horário</h2>

            {/* Schedule Info Banner */}
            <div className="schedule-info mb-4 p-3 bg-light rounded text-center">
                <h4 className="mb-1">{schedule?.Name}</h4>
                <p className="mb-0">Horário Semanal – Edição</p>
                <div className="d-flex justify-content-center flex-wrap gap-4 mt-2 fw-medium">
                    {schedule?.CurricularYear &&
                        withTooltip(
                            <FaGraduationCap className="icon-primary" />,
                            "Ano Curricular",
                            schedule.CurricularYear
                        )}
                    {schedule?.Class &&
                        withTooltip(
                            <FaChalkboardTeacher className="icon-primary" />,
                            "Turma",
                            schedule.Class
                        )}
                    {withTooltip(
                        <FaCalendarPlus className="icon-primary" />,
                        "Data de início",
                        new Date(schedule?.StartDate).toLocaleDateString("pt-PT")
                    )}
                    {withTooltip(
                        <FaCalendarCheck className="icon-primary" />,
                        "Data de fim",
                        new Date(schedule?.EndDate).toLocaleDateString("pt-PT")
                    )}
                </div>
            </div>

            {/* Message Alert */}
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
                {/* Left Sidebar */}
                <Col md={3}>
                    {/* Course Selection */}
                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Cadeiras</Card.Header>
                        <Card.Body>
                            {/* Search Bar */}
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="text"
                                    placeholder="Pesquisar cadeira ou professor..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </Form.Group>

                            {/* Course List */}
                            {currentCourses.map((course) => (
                                <div key={course.id} className="mb-3">
                                    <Form.Check
                                        type="radio"
                                        id={`course-${course.id}`}
                                        name="course"
                                        label={
                                            <span>
                        {course.name}{" "}
                                                <span className="tipology-badge">
                          ({course.type === "Teorico-Pratica" ? "TP" : course.type === "Pratica" ? "P" : "T"})
                        </span>
                        <br />
                        <span className="professor-badge">({course.professor})</span>
                      </span>
                                        }
                                        onChange={() => setCurrentCourse(course.id)}
                                        checked={currentCourse === course.id}
                                    />
                                </div>
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-3">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        &laquo;
                                    </Button>
                                    <span className="mx-2">
                    Pg. {currentPage} de {totalPages}
                  </span>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        &raquo;
                                    </Button>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Controls */}
                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Controles</Card.Header>
                        <Card.Body className="d-grid gap-2">
                            <Button variant="secondary" onClick={() => navigate("/calendar")}>
                                ← Voltar aos Horários
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => navigate(`/calendar/${scheduleId}/view`)}
                            >
                                👁️ Ver Horário
                            </Button>
                        </Card.Body>
                    </Card>

                    {/* Statistics */}
                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Estatísticas</Card.Header>
                        <Card.Body className="text-center">
                            <div className="mb-3">
                                <h4 className="text-primary mb-1">{stats.total}</h4>
                                <small className="text-muted">Aulas Totais</small>
                            </div>
                            <div className="mb-3">
                                <h4 className="text-success mb-1">{stats.uniq}</h4>
                                <small className="text-muted">Disciplinas</small>
                            </div>
                            <div>
                                <h4 className="text-warning mb-1">{stats.hours} h</h4>
                                <small className="text-muted">Horas Semanais</small>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Instructions */}
                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Instruções</Card.Header>
                        <Card.Body>
                            <ol className="ps-3">
                                <li className="mb-2">Clique numa aula para editá-la</li>
                                <li className="mb-2">Selecione uma cadeira para adicionar nova aula</li>
                                <li className="mb-2">Clique e arraste no calendário para criar aula</li>
                                <li className="mb-2">Todas as aulas devem ter uma sala atribuída</li>
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
                                slotDuration="00:30:00"
                                slotMinTime="08:30:00"
                                slotMaxTime="23:30:00"
                                allDaySlot={false}
                                weekends={true}
                                hiddenDays={[0]}
                                selectable={true}
                                selectMirror={true}
                                dayMaxEvents={true}
                                select={handleDateSelect}
                                eventClick={handleEventClick}
                                events={[...events, ...eventosConflito]}
                                height="auto"
                                locale="pt"
                                firstDay={1}
                                dayHeaderFormat={{ weekday: "short" }}
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
                                eventContent={({ event, timeText }) => (
                                    <div className="d-flex justify-content-between align-items-center w-100">
                                        <div>
                                            <b>{timeText}</b> <i>{event.title}</i>
                                        </div>
                                        {!event.classNames?.includes('evento-conflito') && !event.classNames?.includes('evento-ocupado') && (
                                            <FaEdit
                                                className="edit-icon ms-2"
                                                style={{ cursor: 'pointer', fontSize: '12px', color: '#6c757d' }}
                                            />
                                        )}
                                    </div>
                                )}
                            />
                        </Card.Body>
                    </Card>

                    {/* Save Button */}
                    <Row className="mt-4">
                        <Col md={12}>
                            <Card className="mb-4 card">
                                <Card.Body>
                                    <Row>
                                        <Col md={9}>
                                            <Alert variant="info">
                                                Clique numa aula para editá-la ou selecione uma cadeira e clique no calendário para adicionar nova aula.
                                            </Alert>
                                        </Col>
                                        <Col md={3} className="d-flex align-items-center">
                                            <Button
                                                className="w-100 button"
                                                onClick={saveSchedule}
                                            >
                                                Guardar Alterações
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
                    <Modal.Title>
                        {isEditingEvent ? "Editar Aula" : "Selecionar Sala"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedEvent && (
                        <>
                            <p>
                                <strong>Cadeira:</strong>{" "}
                                {courses.find((c) => c.id === selectedEvent.extendedProps.courseId)?.name ||
                                    `Cadeira não encontrada (ID: ${selectedEvent.extendedProps.courseId})`}
                            </p>
                            <p>
                                <strong>Professor:</strong>{" "}
                                {courses.find((c) => c.id === selectedEvent.extendedProps.courseId)?.professor ||
                                    selectedEvent.extendedProps.professor ||
                                    "Professor não definido"}
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
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    {isEditingEvent && (
                        <Button variant="danger" onClick={handleEventRemove}>
                            <FaTrash /> Remover Aula
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setShowRoomModal(false)}>
                        Cancelar
                    </Button>
                    <Button className="button" onClick={handleRoomAssign}>
                        {isEditingEvent ? "Atualizar" : "Confirmar"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
