import { useEffect, useState } from 'react';
import { Button, Container, ListGroup, Spinner, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CreateCalendarModal from '../../../components/Calendar/CreateCalendarModal';
import { createSchedule, fetchUserSchedules } from '../../../api/calendarFetcher';
import { FULL_ROUTES } from "../../../routes.jsx";
import 'bootstrap/dist/css/bootstrap.min.css';
import './CalendarListing.scss';

export default function CalendarListing() {
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleOpenModal = () => {
    setCreateError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleViewSchedule = (scheduleId) => {
    navigate(`/calendar/${scheduleId}/view`);
  };

  useEffect(() => {
    const loadCalendars = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await fetchUserSchedules(token);
        setCalendars(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCalendars();
  }, []);

  const handleCreateCalendar = async ({ courseId, calendarName, startDate, endDate }) => {
    if (new Date(endDate) < new Date(startDate)) {
      setCreateError('A data de fim não pode ser anterior à data de início.');
      return;
    }

    try {
      const data = await createSchedule({
        courseId,
        name: calendarName,
        startDate,
        endDate
      });

      const token = localStorage.getItem('token');
      const updatedCalendars = await fetchUserSchedules(token);
      setCalendars(updatedCalendars);

      navigate(FULL_ROUTES.CALENDAR.CREATE, {
        state: {
          scheduleId: data.scheduleId,
          scheduleName: calendarName,
          startDate: startDate,
          endDate: endDate,
        }
      });
    } catch (error) {
      const message = error?.response?.data?.error || 'Falha ao criar o calendário. Tente novamente.';
      setCreateError(message);
    }
  };

  if (loading) {
    return (
        <Container fluid className="mainContainer d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <Spinner animation="border" />
            <div className="mt-2">A carregar horários...</div>
          </div>
        </Container>
    );
  }

  return (
      <Container fluid className="mainContainer">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="headerText">Meus Horários</h2>
          <Button className="button" onClick={handleOpenModal}>
            Criar novo horário
          </Button>
        </div>

        {createError && (
            <Alert variant="danger" onClose={() => setCreateError(null)} dismissible className="mb-4">
              {createError}
            </Alert>
        )}

        <CreateCalendarModal
            show={showModal}
            onHide={handleCloseModal}
            onSubmit={handleCreateCalendar}
        />

        <Card className="card">
          <Card.Body>
            {error ? (
                <Alert variant="danger">
                  Erro ao carregar horários: {error}
                </Alert>
            ) : calendars.length === 0 ? (
                <div className="empty-state text-center py-5">
                  <h5 className="text-muted mb-3">Nenhum horário encontrado</h5>
                  <p className="text-muted mb-3">
                    Comece criando o seu primeiro horário
                  </p>
                  <Button className="button" onClick={handleOpenModal}>
                    Criar Primeiro Horário
                  </Button>
                </div>
            ) : (
                <ListGroup variant="flush">
                  {calendars.map(cal => (
                      <ListGroup.Item
                          key={cal.Id || cal.id}
                          className="schedule-item"
                          onClick={() => handleViewSchedule(cal.Id || cal.id)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="mb-1">{cal.Name}</h5>
                            {cal.CourseName && (
                                <small className="text-muted">({cal.CourseName})</small>
                            )}
                            <br />
                            <small className="text-muted">
                              Criado em: {new Date(cal.CreatedOn).toLocaleDateString('pt-PT')}
                            </small>
                          </div>
                          <div>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSchedule(cal.Id || cal.id);
                                }}
                            >
                              Ver Horário
                            </Button>
                            <Button
                                className="button"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(FULL_ROUTES.CALENDAR.EDIT.replace(':scheduleId', cal.Id || cal.id));
                                }}
                            >
                              ✏️ Editar
                            </Button>

                          </div>
                        </div>
                      </ListGroup.Item>
                  ))}
                </ListGroup>
            )}
          </Card.Body>
        </Card>
      </Container>
  );
}
