import { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { fetchCoursesWithProfessors } from "../../api/courseFetcher.js";

const CreateCalendarModal = ({ show, onHide, onSubmit }) => {
  const [calendarName, setCalendarName] = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [courses, setCourses]         = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [curricularYear, setCurricularYear] = useState('');
  const [className, setClassName]     = useState('');
  const [dateError, setDateError]     = useState('');

  // carregar lista de cursos
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchCoursesWithProfessors();
        setCourses(data);
      } catch (err) {
        console.error("Erro ao carregar cursos:", err);
      }
    };
    loadCourses();
  }, []);

  const handleStartDateChange = e => {
    setDateError('');          // limpa erros anteriores
    setStartDate(e.target.value);
  };

  const handleEndDateChange = e => {
    setDateError('');
    setEndDate(e.target.value);
  };

  const handleFormSubmit = () => {
    // validações finais só aqui
    if (!calendarName || !selectedCourse || !curricularYear || !className) {
      setDateError("Preencha todos os campos antes de continuar.");
      return;
    }
    if (!startDate || !endDate) {
      setDateError("Escolha data de início e de fim.");
      return;
    }

    const sd = new Date(startDate);
    const ed = new Date(endDate);

    if (sd.getDay() !== 1) {
      setDateError("A data de início tem de ser uma segunda-feira.");
      return;
    }
    if (ed.getDay() !== 6) {
      setDateError("A data de fim tem de ser um sábado.");
      return;
    }
    if (ed < sd) {
      setDateError("A data de fim tem de ocorrer depois da data de início.");
      return;
    }

    // tudo OK → entrega ao pai
    onSubmit({
      courseId: selectedCourse,
      calendarName,
      startDate,
      endDate,
      curricularYear,
      class: className,
    });
    onHide();

    // reset dos campos
    setCalendarName('');
    setStartDate('');
    setEndDate('');
    setSelectedCourse('');
    setCurricularYear('');
    setClassName('');
    setDateError('');
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Criar novo horário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>

          <Form.Group className="mb-3">
            <Form.Label>Nome do horário</Form.Label>
            <Form.Control
              type="text"
              value={calendarName}
              onChange={e => setCalendarName(e.target.value)}
              placeholder="Introduz o nome"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Curso</Form.Label>
            <Form.Select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              <option value="">Selecione um curso</option>
              {courses.map(c => (
                <option key={c.CourseFK} value={c.CourseFK}>
                  {c.Name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ano Curricular</Form.Label>
            <Form.Select
              value={curricularYear}
              onChange={e => setCurricularYear(e.target.value)}
            >
              <option value="">Selecione o ano</option>
              <option value="1º Ano">1º Ano</option>
              <option value="2º Ano">2º Ano</option>
              <option value="3º Ano">3º Ano</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Turma</Form.Label>
            <Form.Select
              value={className}
              onChange={e => setClassName(e.target.value)}
            >
              <option value="">Selecione a turma</option>
              <option value="Turma A">Turma A</option>
              <option value="Turma B">Turma B</option>
              <option value="Turma C">Turma C</option>
              <option value="Turma D">Turma D</option>
              <option value="Turma E">Turma E</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Data de início</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Data de fim</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
            />
          </Form.Group>

          {dateError && (
            <Alert variant="danger">{dateError}</Alert>
          )}

        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleFormSubmit}>
          Continuar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateCalendarModal;
