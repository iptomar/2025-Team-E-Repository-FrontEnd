import { useEffect, useState } from 'react';
import { Button, Container, ListGroup, Spinner, Alert, Pagination, Form} from 'react-bootstrap';
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

  //pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(5); // 5 schedules per page as requested on the Issue #86

  //search
  const [searchTerm, setSearchTerm] = useState('');

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
        setLoading(true);
        const token = localStorage.getItem('token');
        const { schedules, total } = await fetchUserSchedules(
          token, 
          currentPage, 
          itemsPerPage,
          searchTerm
        );
        
        setCalendars(schedules);
        setTotalPages(Math.ceil(total / itemsPerPage));
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Add debounce to prevent excessive API calls
    const debounceTimer = setTimeout(() => {
      loadCalendars();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm]);

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

      setCurrentPage(1);

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
      <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
        <div className="d-flex align-items-center">
          <Form.Control
            type="text"
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px', marginRight: '15px'}}
          />
        <Button variant="primary" onClick={handleOpenModal}>
          Criar novo horário
        </Button>
        </div>
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
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            />
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Calculate page numbers to show
              let startPage;
              if (totalPages <= 5) {
                startPage = 1;
              } else if (currentPage <= 3) {
                startPage = 1;
              } else if (currentPage >= totalPages - 2) {
                startPage = totalPages - 4;
              } else {
                startPage = currentPage - 2;
              }
              
              const pageNumber = startPage + i;
              return (
                <Pagination.Item
                  key={pageNumber}
                  active={pageNumber === currentPage}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Pagination.Item>
              );
            })}
            
            <Pagination.Next 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            />
          </Pagination>
        </div>
      )}
    </Container>
  );
}
