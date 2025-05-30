import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fetchScheduleById } from '../../../api/calendarFetcher';
import { fetchClassrooms } from '../../../api/classroomFetcher';
import { fetchSubjectsWithProfessors } from '../../../api/courseFetcher';
import 'bootstrap/dist/css/bootstrap.min.css';
import './View.scss';

const CalendarView = () => {
    const { scheduleId } = useParams();
    const navigate = useNavigate();

    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [events, setEvents] = useState([]);

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
                    title: `${block.SubjectName} - ${block.ClassroomName || 'Sem sala'} - ${subject?.Professor || 'N/A'}`,
                    start: start,
                    end: end,
                    allDay: false,
                    extendedProps: {
                        professor: subject?.Professor || 'N/A',
                        classroom: block.ClassroomName || classroom?.Name || `Sala ${block.ClassroomFK}`,
                        tipologia: subject?.Tipologia || 'N/A',
                        dayOfWeek: dayOfWeek
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

    function renderEventContent(eventInfo) {
        return (
            <>
                <b>{eventInfo.timeText}</b>
                <i>{eventInfo.event.title}</i>
            </>
        );
    }

    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        alert(`
      Disciplina: ${event.title}
      Professor: ${event.extendedProps.professor}
      Horário: ${event.start.toLocaleTimeString('pt-PT')} - ${event.end.toLocaleTimeString('pt-PT')}
      Sala: ${event.extendedProps.classroom}
      Tipo: ${event.extendedProps.tipologia}
    `);
    };

    const calculateStats = () => ({
        totalClasses: schedule?.blocks?.length || 0,
        uniqueSubjects: new Set(schedule?.blocks?.map(b => b.SubjectName)).size || 0,
        totalHours: schedule?.blocks?.reduce((sum, block) => {
            const start = new Date(`2000-01-01T${block.StartHour}`);
            const end = new Date(`2000-01-01T${block.EndHour}`);
            return sum + (end - start) / (1000 * 60 * 60);
        }, 0).toFixed(1) || 0
    });

    const stats = calculateStats();

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
                    <Button variant="outline-danger" onClick={() => navigate('/calendar')}>
                        Voltar aos Horários
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="mainContainer">
            <h2 className="headerText text-center">
                Visualização de Horário
            </h2>

            <div className="schedule-info mb-4 p-3 bg-light rounded text-center">
                <h4 className="mb-1">{schedule?.Name}</h4>
                <p className="mb-0">
                    Horário Semanal - Visualização
                </p>
            </div>

            <Row>
                <Col md={3}>
                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Controles de Visualização</Card.Header>
                        <Card.Body>
                            <div className="d-grid gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate('/calendar')}
                                >
                                    ← Voltar aos Horários
                                </Button>
                                <Button
                                    className="button"
                                    onClick={() => navigate(`/calendar/create`, {
                                        state: {
                                            scheduleId: scheduleId,
                                            scheduleName: schedule?.Name
                                        }
                                    })}
                                >
                                    ✏️ Editar Horário
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="mb-4 card">
                        <Card.Header className="cardHeader">Estatísticas do Horário</Card.Header>
                        <Card.Body>
                            <div className="text-center mb-3">
                                <h4 className="text-primary mb-1">{stats.totalClasses}</h4>
                                <small className="text-muted">Aulas Totais</small>
                            </div>
                            <div className="text-center mb-3">
                                <h4 className="text-success mb-1">{stats.uniqueSubjects}</h4>
                                <small className="text-muted">Disciplinas</small>
                            </div>
                            <div className="text-center">
                                <h4 className="text-warning mb-1">{stats.totalHours}h</h4>
                                <small className="text-muted">Horas Semanais</small>
                            </div>
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
        </Container>
    );
};

export default CalendarView;
