import React, { useEffect, useState } from 'react';
import { Button, Card, Container, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function CalendarsPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [calendars, setCalendars] = useState([]);

  useEffect(() => {
    // Comentado: ligação futura ao endpoint real
    /*
    fetch('/api/user-calendars') // endpoint real aqui
      .then(response => response.json())
      .then(data => setCalendars(data))
      .catch(error => console.error('Erro ao buscar calendários:', error));
    */

    setCalendars([]); 
  }, []);

  const goToCreateSchedule = () => {
    navigate('/calendario'); 
  };

  return (
    <Container className="mt-4">
      <Card className="mt-4 mb-4">
        <Card.Body>
          <Button variant="primary" onClick={goToCreateSchedule}>
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
    </Container>
  );
}
