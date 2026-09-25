# MIBO API Documentation

Complete technical documentation for the MIBO Mental Health Management System.

## Documentation Files

### API_REFERENCE.md

Complete API endpoint reference organized by module. Lists all endpoints with methods, authentication requirements, roles, and descriptions.

Used for: Quick lookup of any API endpoint, understanding authentication and authorization requirements.

### ARCHITECTURE.md

System architecture overview covering technology stack, design patterns, database schema, and deployment architecture.

Used for: Understanding the overall system design, technology choices, and how components interact.

### DEPLOYMENT.md

Complete deployment setup documentation for AWS infrastructure including S3, CloudFront, Elastic Beanstalk, and RDS.

Used for: Understanding current deployment, deployment processes, environment variables, and scaling strategies.

### WORKFLOWS.md

Step-by-step guides for common workflows like patient booking, clinician sessions, staff operations, and analytics.

Used for: Implementation guides, integration testing, understanding business flows.

### MIBO_API_Postman_Collection.json

Postman collection with all API endpoints pre-configured. Import into Postman for immediate testing.

Used for: API testing, development, integration testing.

## Quick Start

### For Developers

1. Read ARCHITECTURE.md to understand the system
2. Import MIBO_API_Postman_Collection.json into Postman
3. Set environment variables:
   - `base_url`: https://api.mibo.care/api (production) or http://localhost:5000/api (local)
   - `access_token`: (obtained after authentication)
   - `refresh_token`: (obtained after authentication)
4. Test authentication endpoints first
5. Use API_REFERENCE.md as reference while developing

### For Integration Partners

1. Read WORKFLOWS.md for common integration patterns
2. Focus on relevant sections (patient booking, payments, etc.)
3. Use Postman collection for testing
4. Reference API_REFERENCE.md for detailed endpoint specifications

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {access_token}
```

Tokens expire after 15 minutes. Use refresh token endpoint to obtain new access token.

## Base URLs

- Production: https://api.mibo.care/api
- Development: http://localhost:5000/api

## Support

For technical support or questions about the API:

- Email: tech@mibo.care
- Check WORKFLOWS.md for common issues and solutions

## Change Log

### Version 1.0.0 (Current)

- Initial comprehensive documentation
- Complete API reference for all endpoints
- Architecture documentation
- Common workflows guide
- Postman collection

## Contributing to Documentation

When adding new endpoints or features:

1. Update API_REFERENCE.md with endpoint details
2. Update WORKFLOWS.md if it introduces a new workflow
3. Add endpoint to MIBO_API_Postman_Collection.json
4. Update ARCHITECTURE.md if it changes system design

Keep documentation:

- Precise and concise
- Free of emojis
- Focused on facts and implementation details
- Updated with every API change
