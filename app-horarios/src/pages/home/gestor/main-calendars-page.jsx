import { useEffect, useState } from 'react';
import { Button, Card, Container, ListGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CreateCalendarModal from '../../../components/Calendar/CreateCalendarModal'; 
import { createSchedule, fetchUserSchedules } from '../../../api/calendarFetcher';
import {FULL_ROUTES} from "../../../routes.jsx";

export default function CalendarListing() {
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Add missing modal handlers
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

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
    try {
      const data = await createSchedule({ 
        courseId, 
        name: calendarName, 
        startDate, 
        endDate 
      });

      // Refresh calendar list after creation
      const token = localStorage.getItem('token');
      const updatedCalendars = await fetchUserSchedules(token);
      setCalendars(updatedCalendars);

      navigate(FULL_ROUTES.CALENDAR_CREATE, {
        state: {
          scheduleId: data.scheduleId
        }
      });
    } catch (error) {
      console.error(error);
      alert('Falha ao criar o calendário. Tente novamente.');
    }
  };

  return (
    <Container className="mt-4">
      <Card className="mt-4 mb-4">
        <Card.Body>
          <Button variant="primary" onClick={handleOpenModal}>
            Criar novo horário
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Meus Horários</Card.Header>
        <ListGroup variant="flush">
          {loading ? (
            <ListGroup.Item className="text-center">
              <Spinner animation="border" />
            </ListGroup.Item>
          ) : error ? (
            <ListGroup.Item className="text-danger">
              Erro ao carregar horários: {error}
            </ListGroup.Item>
          ) : calendars.length === 0 ? (
            <ListGroup.Item>Nenhum horário encontrado.</ListGroup.Item>
          ) : (
            calendars.map(cal => (
              <ListGroup.Item 
                key={cal.Id}
                action 
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{cal.Name}</strong>
                  {cal.CourseName && (
                    <span className="ms-2 text-muted">({cal.CourseName})</span>
                  )}
                </div>
                <div>
                  <small className="text-muted">
                    Criado em: {new Date(cal.CreatedOn).toLocaleDateString('pt-PT')}
                  </small>
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Card>

      <CreateCalendarModal
        show={showModal}
        handleClose={handleCloseModal}
        onSubmit={handleCreateCalendar}
      />
    </Container>
  );
}