import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  FaCalendarAlt,
  FaCalendarPlus,
  FaCalendarCheck,
  FaGraduationCap,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { fetchScheduleById } from "../../../api/calendarFetcher";
import { fetchClassrooms } from "../../../api/classroomFetcher";
import { fetchSubjectsWithProfessors } from "../../../api/courseFetcher";
import "./View.scss";

/* ---------------------------------------------------- */
/*  Helpers                                             */
/* ---------------------------------------------------- */
const tipologyColor = (t) =>
  t === "Teorico"         ? "#b25d31" :
  t === "Pratica"         ? "#5d9b42" :
  t === "Teorico-Pratica" ? "#4285f4" : "#aa46bb";

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
export default function CalendarView() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  const [schedule, setSchedule]   = useState(null);
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  /* ------------------ Fetch ------------------ */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const token      = localStorage.getItem("token");
        const sched      = await fetchScheduleById(scheduleId, token);
        const classrooms = await fetchClassrooms();
        const subjects   = await fetchSubjectsWithProfessors(
          sched.CurricularYear
        );

        /* blocks → events */
        const startWeek = weekStartOf(new Date());
        const evts = sched.blocks?.map((b) => {
          const subj = subjects.find((s) => s.Id === b.SubjectFK);
          const room = classrooms.find((c) => c.Id === b.ClassroomFK);

          const dow      = b.DayOfWeek ?? 1;
          const baseDate = new Date(startWeek);
          baseDate.setDate(startWeek.getDate() + (dow - 1));

          const [sh, sm] = new Date(b.StartHour).toTimeString().split(":");
          const [eh, em] = new Date(b.EndHour).toTimeString().split(":");

          const start = new Date(baseDate);
          start.setHours(+sh, +sm, 0, 0);
          const end   = new Date(baseDate);
          end.setHours(+eh, +em, 0, 0);

          return {
            id: b.Id,
            title: `${b.SubjectName} - ${b.ClassroomName || room?.Name || "Sem sala"} - ${subj?.Professor || "N/A"}`,
            start,
            end,
            backgroundColor: tipologyColor(subj?.Tipologia),
            borderColor:     tipologyColor(subj?.Tipologia),
            extendedProps: {
              professor: subj?.Professor || "N/A",
              classroom: b.ClassroomName || room?.Name || `Sala ${b.ClassroomFK}`,
              tipologia: subj?.Tipologia || "N/A",
            },
          };
        }) ?? [];

        setSchedule(sched);
        setEvents(evts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [scheduleId]);

  /* ------------------ UI States ------------------ */
  if (loading) {
    return (
      <Container fluid className="mainContainer d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <Spinner animation="border" />
      </Container>
    );
  }

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

  /* ------------------ Stats ------------------ */
  const stats = {
    total:  schedule.blocks.length,
    uniq:   new Set(schedule.blocks.map((b) => b.SubjectName)).size,
    hours:  schedule.blocks.reduce((s, b) => {
              const st = new Date(`2000-01-01T${b.StartHour}`);
              const en = new Date(`2000-01-01T${b.EndHour}`);
              return s + (en - st) / 3_600_000;
            }, 0).toFixed(1),
  };

  /* ------------------ Main Render ------------------ */
  return (
    <Container fluid className="mainContainer">
      <h2 className="headerText text-center">Visualização de Horário</h2>

      {/* INFO BANNER -------------------------------------------------- */}
      <div className="schedule-info mb-4 p-3 rounded text-center" style={{ background: "var(--bs-success-bg-subtle)" }}>
        <h4 className="mb-1">{schedule.Name}</h4>
        <p className="mb-0">Horário Semanal – Visualização</p>

        <div className="d-flex justify-content-center flex-wrap gap-4 mt-2 fw-medium">
          {schedule.CurricularYear &&
            withTooltip(<FaGraduationCap className="icon-primary" />, "Ano Curricular", schedule.CurricularYear)}
          {schedule.Class &&
            withTooltip(<FaChalkboardTeacher className="icon-primary" />, "Turma", schedule.Class)}
          {withTooltip(<FaCalendarPlus  className="icon-primary" />, "Data de início",
            new Date(schedule.StartDate).toLocaleDateString("pt-PT"))}
          {withTooltip(<FaCalendarCheck className="icon-primary" />, "Data de fim",
            new Date(schedule.EndDate).toLocaleDateString("pt-PT"))}
        </div>
      </div>

      <Row>
        {/* CONTROLES -------------------------------------------------- */}
        <Col md={3}>
          <Card className="mb-4 card">
            <Card.Header className="cardHeader">Controles</Card.Header>
            <Card.Body className="d-grid gap-2">
              <Button variant="secondary" onClick={() => navigate("/calendar")}>
                ← Voltar aos Horários
              </Button>
              <Button
                className="button"
                onClick={() =>
                  navigate("/calendar/create", {
                    state: {
                      scheduleId:     scheduleId,
                      scheduleName:   schedule.Name,
                      startDate:      schedule.StartDate,
                      endDate:        schedule.EndDate,
                      curricularYear: schedule.CurricularYear,
                      class:          schedule.Class,
                      blocks:         schedule.blocks, 
                    },
                  })
                }
              >
                ✏️ Editar Horário
              </Button>
            </Card.Body>
          </Card>

          {/* STATS ---------------------------------------------------- */}
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
        </Col>

        {/* CALENDÁRIO ------------------------------------------------- */}
        <Col md={9}>
          <Card className="card">
            <Card.Body>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={false}
                slotDuration="00:30"
                slotMinTime="08:30"
                slotMaxTime="23:30"
                allDaySlot={false}
                weekends
                hiddenDays={[0]}
                dayMaxEvents
                events={events}
                eventContent={({ event, timeText }) => (
                  <>
                    <b>{timeText}</b> <i>{event.title}</i>
                  </>
                )}
                eventClick={({ event }) =>
                  alert(
`Disciplina: ${event.title}
Professor:  ${event.extendedProps.professor}
Horário:    ${event.start.toLocaleTimeString("pt-PT")} – ${event.end.toLocaleTimeString("pt-PT")}
Sala:       ${event.extendedProps.classroom}
Tipo:       ${event.extendedProps.tipologia}`
                  )
                }
                locale="pt"
                firstDay={1}
                height="auto"
                slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
