import { useState, useEffect, useRef, Fragment } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
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

import { io } from "socket.io-client";
import {
  FaGraduationCap,
  FaChalkboardTeacher,
  FaCalendarPlus,
  FaCalendarCheck,
} from "react-icons/fa";
import {toLocalISOString} from "../../../lib/utlity/utility.js";

/**
 * CalendarCreate Component
 *
 * This component implements a weekly schedule management system that follows
 * the IPT (Instituto Politécnico de Tomar) design style.
 */
export default function CalendarCreate() {
  console.log("=== CALENDAR CREATE COMPONENT INITIALIZED ===");

  const tipologyColor = (t) => {
    const color = t === "Teorico"
        ? "#b25d31"
        : t === "Pratica"
            ? "#5d9b42"
            : t === "Teorico-Pratica"
                ? "#4285f4"
                : "#aa46bb";
    console.log(`Tipology color for ${t}:`, color);
    return color;
  };

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  console.log("Current user:", user);

  //websockets
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log("=== WEBSOCKET INITIALIZATION ===");
    const newSocket = io("http://localhost:3001");

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("WebSocket: Cliente conectado -", newSocket.id);

      if (user?.email) {
        console.log("Clearing buffer for user:", user.email);
        newSocket.emit('limparBufferPorEmail', { email: user.email });
      }
    });

    // Cleanup
    return () => {
      console.log("WebSocket: Disconnecting");
      newSocket.disconnect();
    };
  }, []);

  const [eventosConflito, setEventosConflito] = useState([]);
  const [conflitosSala, setConflitosSala] = useState(null);
  const [conflitosProfessor, setConflitosProfessor] = useState(null);

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

  const {
    scheduleId,
    scheduleName,
    startDate,
    endDate,
    curricularYear,
    blocks,
  } = location.state || {};

  console.log("=== LOCATION STATE DEBUG ===");
  console.log("Schedule ID:", scheduleId);
  console.log("Schedule Name:", scheduleName);
  console.log("Start Date:", startDate);
  console.log("End Date:", endDate);
  console.log("Curricular Year:", curricularYear);
  console.log("Blocks:", blocks);

  const renderWithTooltip = (icon, tooltip, value) => (
      <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
      <span className="d-flex align-items-center gap-2">
        {icon} {value}
      </span>
      </OverlayTrigger>
  );

  console.log(startDate);

  //fetches classrooms to dropdown
  useEffect(() => {
    console.log("=== LOADING CLASSROOMS ===");
    const loadClassrooms = async () => {
      try {
        console.log("Fetching classrooms...");
        const response = await fetchClassrooms();
        console.log("Classrooms API response:", response);

        let classroomsData = [];
        if (Array.isArray(response)) {
          classroomsData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          classroomsData = response.data;
        } else if (response?.classrooms && Array.isArray(response.classrooms)) {
          classroomsData = response.classrooms;
        }

        console.log("Classrooms data extracted:", classroomsData);

        // Transform room objects to use lowercase properties
        const transformedRooms = classroomsData.map((room) => ({
          id: room.Id,
          name: room.Name,
        }));

        console.log("Transformed rooms:", transformedRooms);
        setRooms(transformedRooms);
        setLoadingRooms(false);
      } catch (err) {
        console.error("Failed to load classrooms:", err);
        setLoadingRooms(false);
        setRooms([]);
      }
    };
    loadClassrooms();
  }, []);

  useEffect(() => {
    console.log("=== LOADING COURSES ===");
    const loadCourses = async () => {
      setLoadingCourses(true);
      setCoursesError(null);
      try {
        console.log("=== CREATE PAGE SUBJECTS DEBUG ===");
        const data = await fetchSubjectsWithProfessors(curricularYear); // No year filter
        console.log("Raw API response:", data);
        // Check specific subject IDs
        const subject7 = data.find(s => s.Id === 7);
        const subject4 = data.find(s => s.Id === 4);
        console.log("Subject ID 7:", subject7);
        console.log("Subject ID 4:", subject4);

        const colorPalette = [
          "#b25d31",
          "#5d9b42",
          "#4285f4",
          "#aa46bb",
          "#f4b400",
        ];

        const transformed = data.map((subject, index) => {
          const course = {
            id: subject.Id,
            subjectId: subject.IdSubject, // ✅ Changed from subject.IdSubject
            name: subject.Subject,
            professorId: subject.professorId,
            professor: subject.Professor,
            allocatedHours: 0,
            type: subject.Tipologia,
            color: colorPalette[index % colorPalette.length],
          };
          return course;
        });

        console.log("All transformed courses:", transformed);
        setCourses(transformed);
      } catch (err) {
        console.error("Error loading courses:", err);
        setCoursesError(err.message || "Erro ao retornar cadeiras");
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, [curricularYear]);

  // After edit, puts all blocks in calendar
  useEffect(() => {
    console.log("=== CONVERTING BLOCKS TO EVENTS ===");
    console.log("Blocks to convert:", blocks);
    console.log("Curricular year:", curricularYear);

    const convertBlocksToEvents = async () => {
      try {
        console.log("Fetching classrooms and subjects for block conversion...");
        const classrooms = await fetchClassrooms();
        const subjects = await fetchSubjectsWithProfessors(curricularYear);
        console.log("Subjects API response:", subjects);
        console.log("Classrooms for conversion:", classrooms);
        console.log("Subjects for conversion:", subjects);

        const weekStartOf = (d) => {
          const date = new Date(d);
          const diff =
              date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
          return new Date(date.setDate(diff));
        };

        const startWeek = weekStartOf(new Date());
        console.log("Start week calculated:", startWeek);

        const evts = blocks.map((b, index) => {
          console.log("tesaa", subjects)
          console.log(`=== PROCESSING BLOCK ${index} ===`);
          console.log("Block data:", b);

          const subj = subjects.find((s) => s.Id === b.SubjectFK);
          console.log("subjectsss", subj)
          const room = classrooms.find((c) => c.Id === b.ClassroomFK);

          console.log("Found subject for block:", subj);
          console.log("Found room for block:", room);

          const dow = b.DayOfWeek ?? 1;
          console.log("Day of week:", dow);

          const baseDate = new Date(startWeek);
          baseDate.setDate(startWeek.getDate() + (dow - 1));
          console.log("Base date for block:", baseDate);

          const [sh, sm] = new Date(b.StartHour).toTimeString().split(":");
          const [eh, em] = new Date(b.EndHour).toTimeString().split(":");

          console.log("Start time parts:", sh, sm);
          console.log("End time parts:", eh, em);

          const start = new Date(baseDate);
          start.setHours(+sh, +sm, 0, 0);

          const end = new Date(baseDate);
          end.setHours(+eh, +em, 0, 0);

          console.log("Final start time:", start);
          console.log("Final end time:", end);

          const event = {
            id: b.Id,
            title: `${b.SubjectName} - ${
                b.ClassroomName || room?.Name || "Sem sala"
            } - ${subj?.Professor || "N/A"}`,
            start,
            end,
            backgroundColor: tipologyColor(subj?.Tipologia),
            borderColor: tipologyColor(subj?.Tipologia),
            extendedProps: {
              professor: subj?.Professor || "N/A",
              classroom:
                  b.ClassroomName || room?.Name || `Sala ${b.ClassroomFK}`,
              tipologia: subj?.Tipologia || "N/A",
              courseId: subj?.Id || null,
            },
          };

          console.log("Created event:", event);
          return event;
        });

        console.log("All converted events:", evts);
        setEvents(evts); // 👈 aqui é que passa ao calendário
      } catch (err) {
        console.error("Erro ao converter blocos:", err);
      }
    };

    if (blocks && blocks.length > 0 && curricularYear) {
      console.log("Converting blocks to events...");
      convertBlocksToEvents();
    } else {
      console.log("No blocks to convert or missing curricular year");
    }
  }, [blocks, curricularYear]); // 👈 só corre quando estes mudarem

  // Reset conflicts and message quando abrir modal ou iniciar verificação
  useEffect(() => {
    console.log("=== RESETTING CONFLICTS ===");
    console.log("Selected event:", selectedEvent);
    console.log("Selected room:", selectedRoom);

    setConflitosSala(null);
    setConflitosProfessor(null);
    setMessage({ text: "", type: "" });
  }, [selectedEvent, selectedRoom]);

  // Efetua verificação após receber ambos os conflitos
  useEffect(() => {
    console.log("=== CONFLICT VERIFICATION ===");
    console.log("Conflicts sala:", conflitosSala);
    console.log("Conflicts professor:", conflitosProfessor);

    if (conflitosSala === null || conflitosProfessor === null) {
      console.log("Waiting for both conflict responses...");
      return;
    }

    const hasSalaConflict = conflitosSala.some((b) => b.IsConflict);
    const hasProfConflict = conflitosProfessor.some((b) => b.IsConflict);

    console.log("Has sala conflict:", hasSalaConflict);
    console.log("Has professor conflict:", hasProfConflict);

    if (hasSalaConflict) {
      console.log("Sala conflict detected!");
      setMessage({
        text: "Esta sala já tem conflitos neste horário!",
        type: "danger",
      });
      setShowRoomModal(false);
      return;
    }

    if (hasProfConflict) {
      console.log("Professor conflict detected!");
      setMessage({
        text: "Este professor já tem aulas nesse horário!",
        type: "danger",
      });
      setShowRoomModal(false);
      return;
    }

    // Se não houver conflitos, limpa mensagem
    console.log("No conflicts detected, clearing message");
    setMessage({ text: "", type: "" });
  }, [conflitosSala, conflitosProfessor]);

  // Check if the schedule is complete
  useEffect(() => {
    console.log("=== CHECKING SCHEDULE COMPLETION ===");
    console.log("Current events:", events);

    const hasEvents = events.length > 0;
    const allEventsHaveRooms = events.every(
        (event) => event.extendedProps.room && event.extendedProps.room !== ""
    );

    console.log("Has events:", hasEvents);
    console.log("All events have rooms:", allEventsHaveRooms);

    const isComplete = hasEvents && allEventsHaveRooms;
    console.log("Schedule complete:", isComplete);

    setScheduleComplete(isComplete);
  }, [events]);

  // Handle date selection in calendar
  const handleDateSelect = (selectInfo) => {
    console.log("=== DATE SELECT HANDLER ===");
    console.log("Select info:", selectInfo);
    console.log("Current course:", currentCourse);

    if (!currentCourse) {
      console.log("No course selected, showing warning");
      setMessage({
        text: "Selecione uma cadeira antes de adicionar ao horário",
        type: "warning",
      });
      selectInfo.view.calendar.unselect();
      return;
    }

    if (selectInfo.start.getDate() !== selectInfo.end.getDate()) {
      console.log("Multi-day selection detected, rejecting");
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

    console.log("Selection start:", start);
    console.log("Selection end:", end);
    console.log("Duration hours:", durationHours);

    // Check for overlaps with existing events
    const hasOverlap = events.some((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const overlap = start < eventEnd && end > eventStart;
      console.log(`Checking overlap with event ${event.id}:`, overlap);
      return overlap;
    });

    if (hasOverlap) {
      console.log("Overlap detected, rejecting selection");
      setMessage({ text: "Já existe uma aula neste horário", type: "danger" });
      selectInfo.view.calendar.unselect();
      return;
    }

    const selectedCourse = courses.find((c) => c.id === currentCourse);
    console.log("Selected course for new event:", selectedCourse);

    const newEvent = {
      id: Date.now(),
      isNew: true,
      title: `${selectedCourse.name} (Sem sala) - ${selectedCourse.professor}`,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      backgroundColor: selectedCourse.color,
      extendedProps: {
        courseId: currentCourse,
        subjectId: selectedCourse.subjectId,
        room: "",
        professor: selectedCourse.professor,
        duration: durationHours,
      },
    };

    console.log("Created new event:", newEvent);
    setSelectedEvent(newEvent); // só aqui, ainda não é oficial

    // Update allocated hours
    const updatedCourses = courses.map((course) =>
        course.id === currentCourse
            ? { ...course, allocatedHours: course.allocatedHours + durationHours }
            : course
    );

    console.log("Updated courses with allocated hours:", updatedCourses);
    setCourses(updatedCourses);

    // Automatically open room selection modal
    setSelectedEvent(newEvent);
    setSelectedRoom("");
    setShowRoomModal(true);
    selectInfo.view.calendar.unselect();
  };

  // Handle event click to open room selection modal
  const handleEventClick = (clickInfo) => {
    console.log("=== EVENT CLICK HANDLER ===");
    console.log("Clicked event:", clickInfo.event);

    const event = clickInfo.event;
    setSelectedEvent(event);
    setSelectedRoom(event.extendedProps.room || "");
    setShowRoomModal(true);
  };

  const handleRoomAssign = async () => {
    console.log("=== ROOM ASSIGN HANDLER START ===");
    console.log("Available rooms:", rooms);
    console.log("Selected room:", selectedRoom);
    console.log("Selected event:", selectedEvent);

    if (!Array.isArray(rooms) || rooms.length === 0) {
      console.log("No rooms available");
      setMessage({ text: "Dados de sala indisponíveis", type: "danger" });
      return;
    }

    if (!selectedRoom) {
      console.log("No room selected");
      setMessage({ text: "Selecione uma sala para a aula", type: "warning" });
      return;
    }
    const currentBlockId = selectedEvent.extendedProps.blockId ?? selectedEvent.id;

    const selectedCourse = courses.find(
        (c) => c.id === selectedEvent.extendedProps.courseId
    );
    const room = rooms.find((r) => r.id === parseInt(selectedRoom));
    const roomName = room ? room.name : "Sala desconhecida";
    const professor = selectedCourse.professor;
    const eventStart = new Date(selectedEvent.start);
    const eventEnd = new Date(selectedEvent.end);
    const dayOfWeek = eventStart.getDay() === 0 ? 7 : eventStart.getDay();

    console.log("Selected course:", selectedCourse);
    console.log("Selected room object:", room);
    console.log("Room name:", roomName);
    console.log("Professor:", professor);
    console.log("Event start:", eventStart);
    console.log("Event end:", eventEnd);
    console.log("Day of week:", dayOfWeek);

    // 1️⃣ Verifica conflitos de sala específicos (visuais)
    const roomConflictData = {
      roomId: room.id,
      eventStart: toLocalISOString(eventStart),
      eventEnd: toLocalISOString(eventEnd),
      scheduleStartDate: new Date(startDate).toISOString(),
      scheduleEndDate: new Date(endDate).toISOString(),
      excludeBlockId: currentBlockId,
    };

    console.log("=== EMITTING ROOM CONFLICT CHECK ===");
    console.log("Room conflict data:", roomConflictData);

    socket.emit("verificarConflitosSala", roomConflictData);

    socket.once("respostaConflitosSala", async ({ blocos }) => {
      console.log("=== ROOM CONFLICT RESPONSE ===");
      console.log("Room conflict blocos received:", blocos);

      // Calcular base da semana para posicionar blocos no calendário
      const calendarApi = calendarRef.current?.getApi();
      const baseDate = calendarApi
          ? new Date(calendarApi.view.currentStart)
          : new Date();
      const baseMonday = new Date(baseDate);
      baseMonday.setDate(baseMonday.getDate() - baseMonday.getDay() + 1);

      console.log("Calendar API:", calendarApi);
      console.log("Base date:", baseDate);
      console.log("Base Monday:", baseMonday);

      // Mapear blocos para eventos de conflito
      const conflitos = blocos.map((bloco, idx) => {
        console.log(`Processing room conflict bloco ${idx}:`, bloco);

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

        console.log(`Room conflict ${idx} - Day offset: ${dayOffset}, Start: ${start}, End: ${end}, IsConflict: ${isConflict}`);

        return {
          id: `conflito-${idx}`,
          title: isConflict ? "Conflito" : "Ocupado",
          start,
          end,
          backgroundColor: isConflict
              ? "rgba(255, 0, 0, 0.5)"
              : "rgba(128, 128, 128, 0.3)",
          borderColor: isConflict ? "darkred" : "gray",
          textColor: "white",
          editable: false,
          eventDisplay: "block",
          classNames: [isConflict ? "evento-conflito" : "evento-ocupado"],
        };
      });

      console.log("Processed room conflicts:", conflitos);
      setEventosConflito(conflitos);

      // depois de detetares conflitos visuais:
if (conflitos.length > 0) {
  console.log("Room conflicts detected, stopping process");
  setMessage({
    text: "Esta sala já tem conflitos neste horário!",
    type: "danger",
  });

  // 1️⃣ Desmarca o select no calendário
  calendarRef.current.getApi().unselect();

  // 2️⃣ Emite para o backend/remover do buffer
  const { id, extendedProps } = selectedEvent;
  const startHour  = new Date(selectedEvent.start).toTimeString().slice(0,8);
  const endHour    = new Date(selectedEvent.end).toTimeString().slice(0,8);
  const dayOfWeek  = new Date(selectedEvent.start).getDay() || 7;
  const roomId     = parseInt(extendedProps.room, 10) || null;
  const professor  = extendedProps.professor;

  socket.emit("removerSala", {
    roomId,
    dayOfWeek,
    startHour,
    endHour,
    professorName: professor,
  });

  // 3️⃣ Remove definitivamente do estado para desaparecer do calendário
  setEvents(prev => prev.filter(e => String(e.id) !== String(id)));

  // 4️⃣ Fecha o modal
  setShowRoomModal(false);

  return;
}


      // Verifica conflitos do professor
      const professorConflictData = {
        professorId: selectedCourse.professorId,
        eventStart: toLocalISOString(eventStart),
        eventEnd: toLocalISOString(eventEnd),
        scheduleStartDate: new Date(startDate).toISOString(),
        scheduleEndDate: new Date(endDate).toISOString(),
        excludeBlockId: currentBlockId,
        subjectId: selectedCourse.subjectId,
      };

      console.log("=== EMITTING PROFESSOR CONFLICT CHECK ===");
      console.log("Professor conflict data:", professorConflictData);

      socket.emit("verificarConflitosProfessor", professorConflictData);

      socket.once("respostaConflitosProfessor", ({ blocos }) => {
        console.log("=== PROFESSOR CONFLICT RESPONSE ===");
        console.log("Professor conflict blocos received:", blocos);

        const calendarApi = calendarRef.current?.getApi();
        const baseDate = calendarApi
            ? new Date(calendarApi.view.currentStart)
            : new Date();
        const baseMonday = new Date(baseDate);
        baseMonday.setDate(baseMonday.getDate() - baseMonday.getDay() + 1);

        const conflitosProfessor = blocos.map((bloco, idx) => {
          console.log(`Processing professor conflict bloco ${idx}:`, bloco);

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

          console.log(`Professor conflict ${idx} - Day offset: ${dayOffset}, Start: ${start}, End: ${end}, IsConflict: ${isConflict}`);

          return {
            id: `conflito-prof-${idx}`,
            title: isConflict ? "Conflito" : "Ocupado",
            start,
            end,
            backgroundColor: isConflict
                ? "rgba(255, 0, 0, 0.5)"
                : "rgba(128, 128, 128, 0.3)",
            borderColor: isConflict ? "darkred" : "gray",
            textColor: "white",
            editable: false,
            eventDisplay: "block",
            classNames: [isConflict ? "evento-conflito" : "evento-ocupado"],
          };
        });

        console.log("Processed professor conflicts:", conflitosProfessor);
        setEventosConflito(conflitosProfessor);

        const hasConflictProfessor = blocos.some((b) => b.IsConflict);
        console.log("Has professor conflict:", hasConflictProfessor);


  // depois de receber respostaConflitosProfessor:
if (hasConflictProfessor) {
  console.log("Professor conflict detected, stopping process");
  setMessage({
    text: "Este professor já tem aulas nesse horário!",
    type: "danger",
  });

  // 1️⃣ desmarca a seleção no calendário
  calendarRef.current.getApi().unselect();

  // 2️⃣ remove do buffer
  const { id, extendedProps } = selectedEvent;
  const startHour = new Date(selectedEvent.start).toTimeString().slice(0, 8);
  const endHour   = new Date(selectedEvent.end).toTimeString().slice(0, 8);
  const dayOfWeek = new Date(selectedEvent.start).getDay() || 7;
  const roomId    = parseInt(extendedProps.room, 10) || null;
  const professor = extendedProps.professor;

  socket.emit("removerSala", {
    roomId,
    dayOfWeek,
    startHour,
    endHour,
    professorName: professor,
  });

  // 3️⃣ remove do estado para desaparecer do calendário
  setEvents(prev => prev.filter(e => String(e.id) !== String(id)));

  // 4️⃣ fecha o modal
  setShowRoomModal(false);

  return;
}



        selectedEvent.isNew = false;
        console.log("Marked event as not new:", selectedEvent);

        // Se não houve conflito, adiciona ao buffer e atualiza estado
        const startHour = eventStart.toTimeString().slice(0, 8);
        const endHour = eventEnd.toTimeString().slice(0, 8);
        const dataToBuffer = {
          blockId: selectedEvent.extendedProps.blockId ?? selectedEvent.id,
          roomId: room.id,
          professorName: professor,
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
          console.log("=== BUFFER RESPONSE ===");
          console.log("Buffer response:", resposta);

          if (resposta.status === "ok") {
            console.log("Buffer response OK - Processing event");

            // Verifica conflitos locais no frontend
            const roomConflict = events.some((event) => {
              if (parseInt(event.id) === parseInt(selectedEvent.id))
                return false;
              const start = new Date(event.start);
              const end = new Date(event.end);
              const conflict = event.extendedProps.room === selectedRoom &&
                  start < eventEnd &&
                  end > eventStart;
              console.log(`Checking local conflict with event ${event.id}:`, conflict);
              return conflict;
            });

            if (roomConflict) {
              console.log("Local room conflict detected");
              setMessage({
                text: "Conflito local: esta sala já está ocupada.",
                type: "danger",
              });
              return;
            }

            const newEventData = {
              ...selectedEvent,
              title: `${selectedCourse.name} - ${roomName} - ${professor}`,
              extendedProps: {
                ...selectedEvent.extendedProps,
                room: selectedRoom,
              },
            };

            console.log("Adding new event to events array:", newEventData);
            console.log("Current events before add:", events);

            const updatedEvents = [...events, newEventData];
            console.log("Updated events array:", updatedEvents);

            setEvents(updatedEvents);
            setShowRoomModal(false);
            setMessage({
              text: "Sala atribuída com sucesso!",
              type: "success",
            });
          } else {
            console.log("Buffer response ERROR:", resposta.motivo);
            setMessage({ text: resposta.motivo, type: "danger" });
          }
        });
      });
    });
  };

  // Handle event removal
  const handleEventRemove = () => {
    console.log("=== EVENT REMOVE HANDLER ===");
    console.log("Event to remove:", selectedEvent);

    const courseId = selectedEvent.extendedProps.courseId;
    const duration = selectedEvent.extendedProps.duration;

    console.log("Course ID:", courseId);
    console.log("Duration to subtract:", duration);

    // Update allocated hours
    const updatedCourses = courses.map((course) =>
        course.id === courseId
            ? {
              ...course,
              allocatedHours: Math.max(0, course.allocatedHours - duration),
            }
            : course
    );

    console.log("Updated courses after removal:", updatedCourses);
    setCourses(updatedCourses);

    const removeData = {
      roomId: parseInt(selectedEvent.extendedProps.room),
      dayOfWeek:
          new Date(selectedEvent.start).getDay() === 0
              ? 7
              : new Date(selectedEvent.start).getDay(),
      startHour: new Date(selectedEvent.start).toTimeString().slice(0, 8), // HH:mm:ss
      endHour: new Date(selectedEvent.end).toTimeString().slice(0, 8), // HH:mm:ss
      professorName: selectedEvent.extendedProps.professor || "", // se for necessário
    };

    console.log("Emitting remove from buffer:", removeData);
    socket.emit("removerSala", removeData);

    const filteredEvents = events.filter((e) => parseInt(e.id) !== parseInt(selectedEvent.id));
    console.log("Events after removal:", filteredEvents);

    setEvents(filteredEvents);
    setShowRoomModal(false);
    setMessage({ text: "Aula removida com sucesso!", type: "info" });
  };

  const saveSchedule = async () => {
    console.log("=== SAVE SCHEDULE HANDLER ===");
    console.log("Current events:", events);

    if (events.length === 0) {
      console.log("No events to save");
      setMessage({
        text: "O horário está vazio. Adicione aulas antes de guardar.",
        type: "warning",
      });
      return;
    }

    const hasAnyConflict = eventosConflito.some(
      (ev) => ev.title === "Conflito"
    );
    if (hasAnyConflict) {
      setMessage({
        text: "Não podes guardar: existem conflitos de sala ou professor no horário!",
        type: "danger",
      });
      return;
    }

    const eventsWithoutRooms = events.filter(
        (event) => !event.extendedProps.room
    );

    console.log("Events without rooms:", eventsWithoutRooms);

    if (eventsWithoutRooms.length > 0) {
      console.log("Some events don't have rooms assigned");
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

    console.log("Token:", token);
    console.log("User:", user);
    console.log("eventos",events)
    const scheduleList = events.map((event, index) => {
      const scheduleData = {
        subjectId: event.extendedProps.subjectId,
        scheduleId: scheduleId,
        classroomId: event.extendedProps.room,
        startHour: toLocalISOString(new Date(event.start))
            .replace("T", " ")
            .substring(0, 19),
        endHour: toLocalISOString(new Date(event.end))
            .replace("T", " ")
            .substring(0, 19),
        createdBy: user.email,
        dayOfWeek: new Date(event.start).getDay(),
      };

      console.log("=== VALIDATION CHECK ===");
      console.log("Subject ID:", scheduleData.subjectId);
      console.log("Available subject IDs:", courses.map(c => c.id));

      // Validate subject exists
      if (!courses.find(c => c.IdSubject=== scheduleData.courseId)) {
        console.error("Subject ID not found in courses list!");
        throw new Error(`Subject ID ${scheduleData.subjectId} not found`);
      }


      console.log(`=== SCHEDULE DATA ${index} ===`);
      console.log("Event:", event);
      console.log("Schedule data:", scheduleData);
      console.log("Subject ID:", scheduleData.subjectId);
      console.log("Classroom ID:", scheduleData.classroomId);
      console.log("Start hour:", scheduleData.startHour);
      console.log("End hour:", scheduleData.endHour);
      console.log("Day of week:", scheduleData.dayOfWeek);

      return scheduleData;
    });

    console.log("Complete schedule list:", scheduleList);

    //Remove from the buffer the blocks of the schedule
    // When a schedule is saved, we need to remove the blocks from the buffer
    events.forEach((event, index) => {
      // For every event in the schedule
      // Emit the event to remove the room from the buffer
      const removeData = {
        roomId: parseInt(event.extendedProps.room),
        eventStart: new Date(event.start), // Full ISO string
        eventEnd: new Date(event.end), // Full ISO string
      };

      console.log(`Removing event ${index} from buffer:`, removeData);
      socket.emit("removerSala", removeData);
    });

    console.log("Horário guardado:", scheduleList);

    try {
      console.log("=== SAVING EVENTS TO DATABASE ===");
      for (const [index, scheduleData] of scheduleList.entries()) {
        console.log(`Saving event ${index}:`, scheduleData);
        await createEvent(scheduleId, token, scheduleData);
        console.log(`Event ${index} saved successfully`);
      }

      console.log("All events saved, navigating to home");
      setMessage({ text: "Horário guardado com sucesso!", type: "success" });
      alert("Horário guardado com sucesso!");
      navigate(FULL_ROUTES.HOME);
    } catch (error) {
      console.error("Error saving schedule:", error);
      setMessage({ text: error.message, type: "error" });
    }
  };

  function renderEventContent(eventInfo) {
    console.log("Rendering event content:", eventInfo);
    return (
        <>
          <b>{eventInfo.timeText}</b>
          <i>{eventInfo.event.title}</i>
        </>
    );
  }

  // Debug state changes
  useEffect(() => {
    console.log("Events state updated:", events);
  }, [events]);

  useEffect(() => {
    console.log("Courses state updated:", courses);
  }, [courses]);

  useEffect(() => {
    console.log("Current course changed:", currentCourse);
  }, [currentCourse]);

  useEffect(() => {
    console.log("Selected event changed:", selectedEvent);
  }, [selectedEvent]);

  useEffect(() => {
    console.log("Selected room changed:", selectedRoom);
  }, [selectedRoom]);

  useEffect(() => {
    console.log("Message state changed:", message);
  }, [message]);

  return (
      <Container fluid className="mainContainer">
        <h2 className="headerText text-center">
          Plataforma de Gestão de Horários
        </h2>

        <div className="schedule-info mb-4 p-3 bg-light rounded text-center">
          <h4 className="mb-1">{scheduleName}</h4>
          <p className="mb-0">Horário Semanal – Criação</p>
          <div className="d-flex justify-content-center flex-wrap gap-4 mt-2 fw-medium">
            {location.state?.curricularYear &&
                renderWithTooltip(
                    <FaGraduationCap className="icon-primary" />,
                    "Ano Curricular",
                    location.state.curricularYear
                )}
            {location.state?.class &&
                renderWithTooltip(
                    <FaChalkboardTeacher className="icon-primary" />,
                    "Turma",
                    location.state.class
                )}
            {renderWithTooltip(
                <FaCalendarPlus className="icon-primary" />,
                "Data de início",
                new Date(startDate).toLocaleDateString("pt-PT")
            )}
            {renderWithTooltip(
                <FaCalendarCheck className="icon-primary" />,
                "Data de fim",
                new Date(endDate).toLocaleDateString("pt-PT")
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

                {/* Loading State */}
                {loadingCourses && (
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                )}

                {/* Error State */}
                {coursesError && (
                    <Alert variant="danger">{coursesError}</Alert>
                )}

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
                            (
                                    {course.tipologia === "Teorico-Pratica"
                                        ? "TP"
                                        : course.tipologia === "Pratica"
                                            ? "P"
                                            : "T"}
                                    )
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
                              variant={
                                currentPage === 1 ? "primary" : "outline-secondary"
                              }
                              size="sm"
                              className="mx-1 pagination-btn"
                              onClick={() => setCurrentPage(1)}
                          >
                            1
                          </Button>

                          {/* Page 2 (if exists) */}
                          {totalPages >= 2 && (
                              <Button
                                  variant={
                                    currentPage === 2 ? "primary" : "outline-secondary"
                                  }
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
                                  variant={
                                    currentPage === 3 ? "primary" : "outline-secondary"
                                  }
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
                    events={[...events, ...eventosConflito]}
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
                        )?.name || "Cadeira não encontrada"
                    }
                  </p>
                  <p>
                    <strong>Professor:</strong>{" "}
                    {
                        courses.find(
                            (c) => c.id === selectedEvent.extendedProps.courseId
                        )?.professor || "Professor não encontrado"
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
                        rooms.map((room) => (
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
            {selectedEvent && !selectedEvent.isNew && (
                <Button variant="danger" onClick={handleEventRemove}>
                  Remover Aula
                </Button>
            )}
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
