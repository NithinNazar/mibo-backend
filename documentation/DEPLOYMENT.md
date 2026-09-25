# MIBO Deployment Architecture

## Current Deployment Setup

The entire MIBO system is deployed on AWS infrastructure.

### Infrastructure Components

#### 1. Frontend Applications (AWS S3 + CloudFront)

**Patient Frontend (mibo.care)**

- Hosting: AWS S3 bucket with static website hosting
- CDN: CloudFront distribution for global content delivery
- HTTPS: SSL/TLS certificates via AWS Certificate Manager
- Build: React + Vite production build
- Deployment: `dist/` folder synced to S3, CloudFront cache invalidated

**Admin Panel (admin.mibo.care)**

- Hosting: AWS S3 bucket with static website hosting
- CDN: CloudFront distribution for global content delivery
- HTTPS: SSL/TLS certificates via AWS Certificate Manager
- Build: React + Vite production build
- Deployment: `dist/` folder synced to S3, CloudFront cache invalidated

#### 2. Backend API (AWS Elastic Beanstalk)

- Platform: Node.js 18 on Amazon Linux 2
- Application: Express.js API server
- Load Balancer: Application Load Balancer (ALB)
- Health Monitoring: /health endpoint
- Auto Scaling: Based on CPU and memory metrics
- Environment: All config via environment variables
- Domain: api.mibo.care

#### 3. Database (AWS RDS PostgreSQL)

- Engine: PostgreSQL 14
- Instance: db.t3.micro (production can be scaled)
- Storage: 20GB SSD with auto-scaling
- Backups: Automated daily backups with 7-day retention
- SSL: Enabled for encrypted connections
- Region: eu-north-1

#### 4. File Storage (AWS S3 + CloudFront)

- Profile Pictures: S3 bucket for clinician profile images
- CDN Delivery: CloudFront for fast global access
- Upload Size: Max 10MB per file
- Formats: Images only (jpg, png, webp)

### DNS Configuration (Route 53)

- mibo.care → CloudFront (Patient Frontend)
- admin.mibo.care → CloudFront (Admin Panel)
- api.mibo.care → Application Load Balancer (Backend)

## Deployment Process

### Backend Deployment

1. Code pushed to repository
2. AWS Elastic Beanstalk pulls latest code
3. Installs dependencies (`npm install`)
4. Builds TypeScript (`npm run build`)
5. Runs health checks
6. Switches traffic to new version
7. Old version remains for rollback

### Frontend Deployment

**Patient Frontend (mibo_version-2)**

```bash
cd mibo_version-2
npm run build
aws s3 sync dist/ s3://mibo-frontend --delete
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

**Admin Panel (mibo-admin)**

```bash
cd mibo-admin
npm run build
aws s3 sync dist/ s3://mibo-admin --delete
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

### Database Updates

Migrations run manually via SQL scripts in `migrations/` folder.

## Environment Variables

### Backend (Elastic Beanstalk)

- DATABASE_URL: PostgreSQL connection string
- JWT_ACCESS_SECRET: JWT signing secret
- JWT_REFRESH_SECRET: Refresh token secret
- RAZORPAY_KEY_ID: Razorpay API key
- RAZORPAY_KEY_SECRET: Razorpay secret
- RAZORPAY_WEBHOOK_SECRET: Webhook verification
- GALLABOX_API_KEY: WhatsApp API key
- GALLABOX_API_SECRET: WhatsApp secret
- AWS_ACCESS_KEY_ID: S3 access
- AWS_SECRET_ACCESS_KEY: S3 secret
- AWS_S3_BUCKET: Profile picture bucket
- CLOUDFRONT_DOMAIN: CDN domain
- CORS_ORIGIN: Allowed frontend domains

### Frontend (Build-time)

- VITE_API_BASE_URL: Backend API URL (https://api.mibo.care/api)
- VITE_RAZORPAY_KEY_ID: Razorpay public key

## Monitoring & Logging

### Backend

- CloudWatch Logs: Application logs
- CloudWatch Metrics: CPU, memory, request count
- ALB Metrics: Request rate, response time, error rate
- Health Checks: Every 30 seconds

### Frontend

- CloudFront Metrics: Cache hit ratio, request count
- S3 Metrics: Storage used, request count
- CloudWatch Alarms: Error rate monitoring

### Database

- RDS Metrics: Connections, CPU, storage
- Performance Insights: Query performance
- Automated backups: Daily at 3 AM UTC

## Security

### Network Security

- Backend: Private subnet with ALB in public subnet
- Database: Private subnet, accessible only from backend
- S3: Bucket policies restrict access to CloudFront only

### Data Security

- HTTPS enforced on all domains
- SSL/TLS for database connections
- Encrypted backups
- Secrets in AWS Secrets Manager (future)

### Access Control

- IAM roles for service-to-service access
- No hardcoded credentials
- MFA required for AWS console access

## Costs (Approximate Monthly)

### Compute

- Elastic Beanstalk (t3.small): $15
- RDS (db.t3.micro): $15

### Storage & CDN

- S3 Storage: $2
- CloudFront: $10-30 (traffic dependent)

### Other

- Data Transfer: $5-10
- CloudWatch Logs: $5

**Total: ~$52-77/month** (scales with traffic)

## Rollback Procedure

### Backend

1. Access Elastic Beanstalk console
2. Select environment
3. Click "Application versions"
4. Select previous working version
5. Click "Deploy"
6. Monitor health checks

### Frontend

1. Revert to previous S3 version (versioning enabled)
2. Invalidate CloudFront cache
3. Test functionality

### Database

1. Use RDS automated backup
2. Restore to point in time
3. Update connection strings if needed

## Scaling Strategy

### Current Capacity

- 100+ concurrent users
- 1000 appointments/day
- 50 clinicians

### Horizontal Scaling

- Add more Elastic Beanstalk instances
- Configure auto-scaling policies
- CloudFront scales automatically

### Vertical Scaling

- Upgrade RDS instance class
- Upgrade EB instance type
- Increase connection pool size

### Future Optimizations

- Add Redis for caching
- Implement CDN caching for API responses
- Add read replicas for database
- Implement microservices architecture
