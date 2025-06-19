/**
 * @fileoverview API service for managing courses and subjects with professor assignments
 * @module CourseAPI
 */

/**
 * @typedef {Object} Course
 * @property {number} Id - The course ID
 * @property {string} Subject - The subject name
 * @property {string} Professor - The professor name
 * @property {'Teorico'|'Pratica'|'Teorico-Pratica'} Tipologia - The course typology
 * @property {number} HoursP - Practical hours (must be >= 0)
 * @property {number} HoursT - Theoretical hours (must be >= 0)
 * @property {number} HoursTP - Theoretical-practical hours (must be >= 0)
 * @property {number} TotalHours - Total hours (sum of all hour types)
 */

import axios from "axios";

const API_BASE = import.meta.env.VITE_WS_URL;

/**
 * Fetches subjects with professors from the API
 * @async
 * @function fetchSubjectsWithProfessors
 * @returns {Promise<Course[]>} Promise that resolves to an array of courses
 * @throws {Error} When API request fails or authentication is invalid
 * @example
 * // Fetch all subjects
 * const subjects = await fetchSubjectsWithProfessors();
 * console.log(subjects[0].Subject); // "Networking II"
 */
export const fetchSubjectsWithProfessors = async (year) => {
  const url = new URL(`${API_BASE}/api/admin/subjects-professors`);
  if (year) url.searchParams.append('year', year); // já espera o valor tipo "1º Ano"

  const response = await axios.get(url.toString(), {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  return response.data;
};


export const fetchCoursesWithProfessors = async () => {
    const response = await axios.get(`${API_BASE}/api/admin/courses-professors`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.data;
};
