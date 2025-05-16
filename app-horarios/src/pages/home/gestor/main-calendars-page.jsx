import { useEffect, useState } from 'react';
import { Button, Card, Container, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CreateCalendarModal from '../../../components/Calendar/CreateCalendarModal'; 

export default function CalendarsPage() {
  const navigate = useNavigate();
  //todo: implementar juntamente com endpoint todo1
  //const [userEmail, setUserEmail] = useState('');
  const [calendars, setCalendars] = useState([]);

  const [showModal, setShowModal] = useState(false); 
  
  useEffect(() => {
    // todo1: ligação futura ao endpoint real
    /*
    fetch('/api/user-calendars') // endpoint real aqui
      .then(response => response.json())
      .then(data => setCalendars(data))
      .catch(error => console.error('Erro ao buscar calendários:', error));
    */
    
    setCalendars([]); 
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };


 
  const handleCreateCalendar = ({courseName, calendarName, startDate, endDate }) => {

    navigate('/calendario', {
      state: {
        courseName,
        calendarName,
        startDate,
        endDate
      }
    });
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
          {calendars.length === 0 ? (
            <ListGroup.Item>Nenhum horário encontrado.</ListGroup.Item>
          ) : (
            calendars.map(cal => (
              <ListGroup.Item key={cal.id}>
                <strong>{cal.name}</strong> <span style={{ color: '#888' }}>({cal.createdAt})</span>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Card>

      {/* Modal */}
      <CreateCalendarModal
        show={showModal}
        handleClose={handleCloseModal}
        onSubmit={handleCreateCalendar}
      />
    </Container>
  );
}
