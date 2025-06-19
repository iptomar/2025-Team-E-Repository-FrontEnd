import { useEffect, useState } from "react";
import {
  Button,
  Container,
  ListGroup,
  Spinner,
  Alert,
  Pagination,
  Form,
  Card,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiEye,
} from "react-icons/fi";
import {
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaGraduationCap,
  FaBook
} from "react-icons/fa";
import CreateCalendarModal from "../../../components/Calendar/CreateCalendarModal";
import {
  createSchedule,
  fetchUserSchedules,
  fetchUserCourses,
} from "../../../api/calendarFetcher";
import { FULL_ROUTES } from "../../../routes.jsx";

export default function CalendarListing() {
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(5);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCurricularYear, setSelectedCurricularYear] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

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
        const token = localStorage.getItem("token");
        const { schedules, total } = await fetchUserSchedules(
          token,
          currentPage,
          itemsPerPage,
          searchTerm,
          selectedClass,
          selectedCurricularYear,
          selectedCourse
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

    const debounceTimer = setTimeout(() => {
      loadCalendars();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm, selectedClass, selectedCurricularYear, selectedCourse]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await fetchUserCourses(token);
        setCourses(data);
      } catch (err) {
        console.error("Erro ao carregar cursos:", err.message);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedCurricularYear, selectedCourse, searchTerm]);

  const handleCreateCalendar = async ({
    courseId,
    calendarName,
    startDate,
    endDate,
    curricularYear,
    class: className,
  }) => {
    if (new Date(endDate) < new Date(startDate)) {
      setCreateError("A data de fim não pode ser anterior à data de início.");
      return;
    }

    try {
      const data = await createSchedule({
        courseId,
        name: calendarName,
        startDate,
        endDate,
        curricularYear,
        class: className,
      });

      setCurrentPage(1);

      navigate(FULL_ROUTES.CALENDAR.CREATE, {
        state: {
          scheduleId: data.scheduleId,
          scheduleName: calendarName,
          startDate,
          endDate,
          curricularYear,
          class: className,
        },
      });
    } catch (error) {
      const message = error?.message || "Falha ao criar o calendário. Tente novamente.";
      setCreateError(message);
    }
  };

  const renderWithTooltip = (icon, tooltip, value) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
      <div className="d-flex align-items-center gap-2">
        {icon} <span>{value}</span>
      </div>
    </OverlayTrigger>
  );

  const renderTextWithTooltip = (text, tooltip) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
      <span>{text}</span>
    </OverlayTrigger>
  );

  return (
    <Container>
      <Card className="p-3 my-4">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <Form.Control
              type="text"
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "250px" }}
            />
            <Form.Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: "200px" }}
            >
              <option value="">Filtrar por turma</option>
              <option value="Turma A">Turma A</option>
              <option value="Turma B">Turma B</option>
              <option value="Turma C">Turma C</option>
              <option value="Turma D">Turma D</option>
              <option value="Turma E">Turma E</option>
            </Form.Select>
            <Form.Select
              value={selectedCurricularYear}
              onChange={(e) => setSelectedCurricularYear(e.target.value)}
              style={{ width: "230px" }}
            >
              <option value="">Filtrar por Ano Curricular</option>
              <option value="1º Ano">1º Ano</option>
              <option value="2º Ano">2º Ano</option>
              <option value="3º Ano">3º Ano</option>
            </Form.Select>
            <Form.Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{ width: "250px" }}
            >
              <option value="">Filtrar por Curso</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </Form.Select>
          </div>

          <Button variant="primary" onClick={handleOpenModal} className="d-flex align-items-center gap-2">
            <FiPlus /> Criar novo horário
          </Button>
        </div>
      </Card>

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
        <Alert variant="danger">Erro ao carregar horários: {error}</Alert>
      ) : calendars.length === 0 ? (
        <Alert variant="info">Nenhum horário encontrado.</Alert>
      ) : (
        <ListGroup>
          {calendars.map((cal) => (
            <ListGroup.Item
              key={cal.Id || cal.id}
              className="d-flex justify-content-between align-items-center gap-3"
              style={{ cursor: "pointer" }}
              onClick={() => handleViewSchedule(cal.Id || cal.id)}
            >
              <div>
                <h5 className="mb-1 d-flex align-items-center gap-2">
                  <FaCalendarAlt className="icon-primary"/> {renderTextWithTooltip(cal.Name, "Nome do horário")}
                </h5>
                <div className="mt-2 d-flex flex-row flex-wrap gap-4">
                  {renderWithTooltip(<FaGraduationCap className="icon-primary" />, "Ano Curricular", cal.CurricularYear)}
                  {renderWithTooltip(<FaChalkboardTeacher className="icon-primary" />, "Turma", cal.Class)}
                  {renderWithTooltip(<FaBook className="icon-primary"/>, "Curso", cal.CourseName)}
                  {renderWithTooltip(<FaCalendarAlt className="icon-primary"/>, "Data de criação", new Date(cal.CreatedOn).toLocaleDateString("pt-PT"))}
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
                  className="d-flex align-items-center gap-2"
                >
                  <FiEye /> Ver
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
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            />

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            />
          </Pagination>
        </div>
      )}
    </Container>
  );
}