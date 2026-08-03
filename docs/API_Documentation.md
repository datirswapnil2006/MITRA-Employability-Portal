# MITRA Employability Portal - API Documentation

Base URL: `http://localhost:5000/api`

---

## 🔑 Authentication Endpoints

### 1. Register Candidate
- **Method**: `POST`
- **Endpoint**: `/auth/register`
- **Description**: Registers a new student candidate account. Sets status to `pending`.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Swapnil Datir",
    "email": "student@college.edu",
    "password": "Password123!",
    "erpNumber": "ERP908123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful. Awaiting admin approval."
  }
  ```

### 2. Login User
- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Description**: Authenticates admin or approved student and returns JWT.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "student@college.edu",
    "password": "Password123!",
    "role": "student"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "_id": "66a4f912c...",
      "name": "Swapnil Datir",
      "email": "student@college.edu",
      "role": "student",
      "status": "approved"
    }
  }
  ```

### 3. Forgot Password
- **Method**: `POST`
- **Endpoint**: `/auth/forgot-password`
- **Description**: Generates password reset token and emails OTP link via Nodemailer.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "student@college.edu"
  }
  ```

### 4. Reset Password
- **Method**: `POST`
- **Endpoint**: `/auth/reset-password/:token`
- **Description**: Updates user password using reset token.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "password": "NewSecurePassword123!"
  }
  ```

---

## 👑 Admin Management Endpoints

### 5. Get Pending Registrations
- **Method**: `GET`
- **Endpoint**: `/admin/registrations`
- **Description**: Lists all candidate accounts with `pending` status.
- **Auth Required**: Yes (Admin Token)

### 6. Approve / Reject Registration
- **Method**: `PUT`
- **Endpoint**: `/admin/registrations/:id`
- **Description**: Updates student status to `approved` or `rejected`.
- **Auth Required**: Yes (Admin Token)
- **Request Body**:
  ```json
  {
    "status": "approved"
  }
  ```

### 7. Get All Students & Analytics
- **Method**: `GET`
- **Endpoint**: `/admin/students`
- **Description**: Retrieves candidate list, test participation counts, and average scores.
- **Auth Required**: Yes (Admin Token)

---

## 📝 Test Management Endpoints

### 8. Create Test
- **Method**: `POST`
- **Endpoint**: `/tests`
- **Description**: Creates a new placement assessment test container.
- **Auth Required**: Yes (Admin Token)
- **Request Body**:
  ```json
  {
    "title": "Data Structures & Algorithms Mock 1",
    "description": "Comprehensive DSA placement evaluation",
    "durationMinutes": 60,
    "passingMarks": 40
  }
  ```

### 9. Enable / Disable Test
- **Method**: `PATCH`
- **Endpoint**: `/tests/:id/toggle`
- **Description**: Toggles test status between active/disabled. Cannot enable test with zero questions.
- **Auth Required**: Yes (Admin Token)

---

## 🤖 Question Bank & AI Endpoints

### 10. Manual Question Creation
- **Method**: `POST`
- **Endpoint**: `/questions`
- **Description**: Adds MCQ or Coding question to question bank or test.
- **Auth Required**: Yes (Admin Token)

### 11. Extract Questions from PDF
- **Method**: `POST`
- **Endpoint**: `/questions/pdf-extract`
- **Description**: Parses uploaded PDF exam file and extracts questions into question bank.
- **Auth Required**: Yes (Admin Token)

### 12. AI Question Generator
- **Method**: `POST`
- **Endpoint**: `/questions/ai-generate`
- **Description**: Invokes HuggingFace AI model to generate formatted questions.
- **Auth Required**: Yes (Admin Token)
- **Request Body**:
  ```json
  {
    "topic": "Dynamic Programming",
    "difficulty": "medium",
    "questionType": "coding",
    "count": 3
  }
  ```

---

## ⏱️ Test Attempt & Proctoring Endpoints

### 13. Start Test Attempt
- **Method**: `POST`
- **Endpoint**: `/attempts/start`
- **Description**: Initiates a timed attempt session for an enabled test.
- **Auth Required**: Yes (Student Token)

### 14. Submit Test Attempt
- **Method**: `POST`
- **Endpoint**: `/attempts/submit`
- **Description**: Submits candidate answers, triggers Piston compiler execution for coding problems, calculates score, and saves attempt.
- **Auth Required**: Yes (Student Token)

### 15. Log Proctoring Violation
- **Method**: `POST`
- **Endpoint**: `/proctoring/violation`
- **Description**: Records webcam face detection violation or tab switch event.
- **Auth Required**: Yes (Student Token)
- **Request Body**:
  ```json
  {
    "attemptId": "66b12a...",
    "type": "FACE_NOT_FOUND",
    "timestamp": "2026-08-03T16:22:11.000Z"
  }
  ```

---

## 🎯 Psychometric & Self-Test Endpoints

### 16. Generate AI Self-Test
- **Method**: `POST`
- **Endpoint**: `/self-tests/generate`
- **Description**: Generates custom student practice test based on topic selection.
- **Auth Required**: Yes (Student Token)

### 17. Upload Study Material
- **Method**: `POST`
- **Endpoint**: `/materials/upload`
- **Description**: Uploads PDF/reference study material.
- **Auth Required**: Yes (Admin Token)
