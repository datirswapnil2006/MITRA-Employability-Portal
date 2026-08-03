# Testing & Quality Assurance Guide

## 1. Testing Strategy Overview

The testing framework covers unit tests, integration tests, and manual acceptance testing across client and server layers.

---

## 2. Manual Verification Matrix

| Area | Workflow | Verification Steps |
| :--- | :--- | :--- |
| **Auth** | Candidate Signup | Submit registration → Check database state (`status: pending`) → Verify login is blocked. |
| **Admin** | Student Approval | Log in as admin → Go to Registrations → Approve candidate → Verify candidate login works. |
| **Test** | Timed Exam | Enable test with questions → Log in as student → Verify timer sync, autosave, and submission scoring. |
| **Code Sandbox**| Code Execution | Submit C++/Python code on coding question → Verify test case evaluation against Piston compiler. |
| **Proctoring** | Face Detection | Cover webcam or switch tab during test → Verify violation log generated in Admin proctoring view. |

---

## 3. Automated API Testing (Postman / Jest)

- **Auth Suite**: Tests JWT issuance, password hashing validation, and expired token rejection.
- **Compiler Suite**: Tests Piston sandbox execution with passing and failing test case inputs.
- **Admin Suite**: Verifies role permissions blocking standard candidates from administrative routes.
