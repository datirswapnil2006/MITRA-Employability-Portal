# Frequently Asked Questions (FAQ)

## 🎓 For Students & Candidates

### Q1: Why can't I log in immediately after registering?
**A**: Candidate registrations are submitted to an admin approval queue. You can log in once your institution's Placement Cell approves your account.

### Q2: What happens if my internet connection drops during a test?
**A**: The test page automatically saves your current answer buffer locally. When connectivity returns, your progress is synced back to the server.

### Q3: Why does the webcam request permission before a test?
**A**: The portal uses client-side AI face detection (`face-api.js`) to verify presence and detect proctoring violations during assessments.

---

## 🏛️ For Placement Cell & Administrators

### Q1: How do I seed initial administrator credentials?
**A**: Run `npm run seed:admin` inside the `server/` directory.

### Q2: Can a test be published with zero questions?
**A**: No, the test enable toggle validation prevents activating empty tests.

### Q3: How are coding questions evaluated?
**A**: Submissions are compiled against sample and hidden test cases using Piston / OnlineCompiler API sandboxes.

---

## 💻 For Developers

### Q1: How do I run the portal locally?
**A**: Start MongoDB, run `npm run dev` in `server/`, and `npm run dev` in `client/`. Refer to [Deployment Guide](Deployment_Guide.md).

### Q2: How can I add new programming language compilers?
**A**: Update the language mapping in `server/services/compilerService.js` to match supported Piston runtimes.
