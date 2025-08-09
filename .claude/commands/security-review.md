# Security Review Command

Perform a comprehensive security audit of the codebase, identifying potential vulnerabilities, security antipatterns, and compliance issues.

## Security Analysis Areas

### 1. Authentication & Authorization
- Check for weak authentication mechanisms
- Verify proper session management
- Review access control implementations
- Identify privilege escalation risks

### 2. Input Validation & Injection
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting) risks
- Command injection possibilities
- Path traversal vulnerabilities
- LDAP injection risks

### 3. Cryptography & Secrets
- Hardcoded secrets, API keys, passwords
- Weak cryptographic implementations
- Insecure random number generation
- Certificate validation issues
- Encryption key management

### 4. Data Protection
- Sensitive data exposure
- Inadequate data sanitization
- Missing data encryption
- Insecure data storage
- Privacy compliance (GDPR, CCPA)

### 5. Network Security
- HTTPS enforcement
- CORS misconfigurations
- Insecure network protocols
- Missing security headers
- API security issues

### 6. Dependencies & Supply Chain
- Vulnerable dependencies
- Outdated packages
- Malicious packages
- License compliance
- Supply chain attacks

### 7. Configuration Security
- Default credentials
- Debug mode in production
- Insecure file permissions
- Missing security configurations
- Environment variable exposure

### 8. Business Logic
- Race conditions
- Business logic flaws
- Workflow bypasses
- Authorization bypasses
- Rate limiting issues

## Review Process

1. **Scan all code files** (.js, .ts, .py, .java, .php, etc.)
2. **Check configuration files** (.env, config.json, docker-compose.yml)
3. **Review dependencies** (package.json, requirements.txt, pom.xml)
4. **Analyze API endpoints** for security issues
5. **Check database interactions** for injection risks
6. **Review authentication/authorization logic**

## Output Format

Provide findings in this structure:

### 🔴 Critical Vulnerabilities
- **File:** `path/to/file.js:123`
- **Issue:** SQL Injection vulnerability
- **Risk:** High - Allows arbitrary database access
- **Fix:** Use parameterized queries

### 🟡 Medium Risk Issues
- **File:** `path/to/file.js:456`
- **Issue:** Missing input validation
- **Risk:** Medium - Could allow malformed data
- **Fix:** Add input validation middleware

### 🟢 Low Risk / Best Practices
- **File:** `path/to/file.js:789`
- **Issue:** Missing security headers
- **Risk:** Low - Reduces defense in depth
- **Fix:** Add helmet.js middleware

### 📋 Security Recommendations
- Enable security linting rules
- Implement automated security testing
- Add security headers middleware
- Regular dependency updates

## Compliance Checks
- OWASP Top 10 compliance
- SOC 2 requirements
- PCI DSS (if applicable)
- GDPR/CCPA data protection