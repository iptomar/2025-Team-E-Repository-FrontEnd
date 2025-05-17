import { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import {fetchCoursesWithProfessors} from "../../api/courseFetcher.js";

const CreateCalendarModal = ({ show, handleClose, onSubmit }) => {
  const [calendarName, setCalendarName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  //Vai buscar a informação do curso(s) do professor
  const loadCourses = async () => {
    try {
      const data = await fetchCoursesWithProfessors(); // recebe os cursos do backend
      setCourses(data); // guarda na state
      } catch (err) {
        console.error("Erro ao carregar cursos:", err);
      }
    };
  
    useEffect(() => {
      loadCourses();  
    }, []);

  const handleFormSubmit = () => {
    onSubmit({ 
      courseId: selectedCourse,
      calendarName, 
      startDate, 
      endDate });
    handleClose(); 
    setSelectedCourse('');
    setCalendarName('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <Modal show={show} onHide={handleClose}>
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
              onChange={(e) => setCalendarName(e.target.value)}
              placeholder="Introduz o nome"
            />
          </Form.Group>

          <Form.Group controlId="courseSelect">
            <Form.Label>Curso</Form.Label>
            <Form.Control
              as="select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Selecione um curso</option>
              {courses.map((course) => (
                 <option key={course.CourseFK} value={course.CourseFK}>
                   {course.Name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Data de início</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Data de fim</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
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
