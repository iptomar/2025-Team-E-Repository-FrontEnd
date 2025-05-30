import { useEffect, useState } from 'react';
import { Button, Container, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CreateCalendarModal from '../../../components/Calendar/CreateCalendarModal';
import { createSchedule, fetchUserSchedules } from '../../../api/calendarFetcher';
import { FULL_ROUTES } from "../../../routes.jsx";

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

  const handleCreateCalendar = async ({
    courseId,
    calendarName,
    startDate,
    endDate,
    curricularYear,
    class: className
  }) => {
    if (new Date(endDate) < new Date(startDate)) {
      setCreateError('A data de fim não pode ser anterior à data de início.');
      return;
    }

    try {
      const data = await createSchedule({
        courseId,
        name: calendarName,
        startDate,
        endDate,
        curricularYear,
        class: className
      });

      const token = localStorage.getItem('token');
      const updatedCalendars = await fetchUserSchedules(token);
      setCalendars(updatedCalendars);

      navigate(FULL_ROUTES.CALENDAR.CREATE, {
        state: {
          scheduleId: data.scheduleId,
          scheduleName: calendarName,
          startDate,
          endDate,
          curricularYear,
          class: className
        }
      });
    } catch (error) {
      const message = error?.message || 'Falha ao criar o calendário. Tente novamente.';
      setCreateError(message);
    }
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Meus Horários</h2>
        <Button variant="primary" onClick={handleOpenModal}>
          Criar novo horário
        </Button>
      </div>

      {createError && (
        <Alert variant="danger" onClose={() => setCreateError(null)} dismissible>
          {createError}
        </Alert>
      )}

      <CreateCalendarModal
        show={showModal}
        onHide={handleCloseModal}
        onSubmit={handleCreateCalendar}
      />

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">
          Erro ao carregar horários: {error}
        </Alert>
      ) : calendars.length === 0 ? (
        <Alert variant="info">
          Nenhum horário encontrado.
        </Alert>
      ) : (
        <ListGroup>
          {calendars.map(cal => (
            <ListGroup.Item
              key={cal.Id || cal.id}
              className="d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewSchedule(cal.Id || cal.id)}
            >
              <div>
                <h5 className="mb-1">{cal.Name}</h5>
                {cal.CourseName && (
                  <small className="text-muted">({cal.CourseName})</small>
                )}
                <div className="mt-1">
                  {cal.CurricularYear && (
                    <div><strong>Ano Curricular:</strong> {cal.CurricularYear}</div>
                  )}
                  {cal.Class && (
                    <div><strong>Turma:</strong> {cal.Class}</div>
                  )}
                  <div>
                    <small className="text-muted">
                      Criado em: {new Date(cal.CreatedOn).toLocaleDateString('pt-PT')}
                    </small>
                  </div>
                </div>
              </div>
              <div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewSchedule(cal.Id || cal.id);
                  }}
                >
                  Ver Horário
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
}
