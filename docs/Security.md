# Security Architecture & Best Practices

## 1. Authentication & Session Management

- **JWT Tokens**: Signed using `jsonwebtoken` with HMAC SHA-256 algorithm and server-side secret (`JWT_SECRET`).
- **Token Transmission**: Passed via `Authorization: Bearer <token>` HTTP header.
- **Password Protection**: Passwords are hashed using `bcryptjs` with 10 salt rounds prior to persistence in MongoDB. Direct plaintext password storage is strictly prevented.

---

## 2. Authorization & Access Control Middleware

Access control is enforced at the API route layer via Express middleware:
- **`protect` Middleware**: Decodes JWT token, verifies signature, and attaches authenticated user payload to `req.user`.
- **`admin` Middleware**: Ensures `req.user.role === 'admin'`. Rejects candidate tokens with `403 Forbidden` status.
- **`approved` Middleware**: Checks `req.user.status === 'approved'`. Prevents pending accounts from logging into assessment endpoints.

---

## 3. Data Validation & Protection Measures

- **NoSQL Injection Defense**: Mongoose schema casting and object sanitization sanitize inputs against query operator injection.
- **CORS Policies**: Explicitly restricts origin access via `CLIENT_URL` configuration in production.
- **XSS Mitigation**: React JSX automatically escapes render strings, shielding against Cross-Site Scripting.

---

## 4. Recommended Production Security Enhancements

1. **Helmet.js Integration**: Attach `helmet()` middleware to enforce security HTTP headers (`Content-Security-Policy`, `X-Frame-Options`).
2. **HttpOnly Cookie Storage**: Transition JWT storage from `localStorage` to `HttpOnly`, `SameSite=Strict` cookies to mitigate XSS token theft.
3. **Rate Limiting**: Configure `express-rate-limit` on login, registration, and compiler execution routes.
