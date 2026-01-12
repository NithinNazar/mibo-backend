# AWS Deployment Guide - Mibo Healthcare Platform

## ✅ AWS Compatibility Assessment

### Backend (Node.js/Express/TypeScript)

✅ **Fully AWS Compatible**

- Standard Node.js/Express application
- Uses environment variables (AWS-friendly)
- Graceful shutdown handlers (perfect for ECS/EC2)
- Health check ready
- SSL/TLS support for RDS
- Stateless architecture (scalable)

### Frontend (React/Vite/TypeScript)

✅ **Fully AWS Compatible**

- Static build output (perfect for S3 + CloudFront)
- Environment variable support
- SPA routing configured (vercel.json → CloudFront rules)
- Production-ready build process

### Database

✅ **Already on AWS RDS PostgreSQL**

- Host: `mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com`
- Database: `mibodb`
- SSL enabled

---

## 🏗️ Recommended AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Route 53 (DNS)                                  │
│  - mibo.com → CloudFront                                     │
│  - api.mibo.com → Application Load Balancer                 │
└────────────┬────────────────────────┬───────────────────────┘
             │                        │
             ▼                        ▼
┌────────────────────────┐  ┌────────────────────────────────┐
│   CloudFront (CDN)     │  │  Application Load Balancer     │
│   - Frontend (React)   │  │  - SSL/TLS Termination         │
│   - Global CDN         │  │  - Health Checks               │
│   - HTTPS              │  │  - Auto Scaling                │
└──────────┬─────────────┘  └──────────┬─────────────────────┘
           │                           │
           ▼                           ▼
┌────────────────────────┐  ┌────────────────────────────────┐
│   S3 Bucket            │  │  ECS Fargate / EC2             │
│   - Static Files       │  │  - Backend API                 │
│   - React Build        │  │  - Node.js/Express             │
│   - Images/Assets      │  │  - Auto Scaling                │
└────────────────────────┘  └──────────┬─────────────────────┘
                                       │
                                       ▼
                            ┌────────────────────────────────┐
                            │  RDS PostgreSQL (Existing)     │
                            │  - mibo-postgres               │
                            │  - Multi-AZ (recommended)      │
                            └────────────────────────────────┘
```

---

## 📋 Deployment Options

### Option 1: ECS Fargate (Recommended - Serverless Containers)

**Pros:**

- No server management
- Auto-scaling
- Pay per use
- Easy deployment
- Built-in load balancing

**Cons:**

- Slightly more expensive than EC2
- Cold start (minimal)

**Best for:** Production, scalability, minimal ops

### Option 2: EC2 with Auto Scaling

**Pros:**

- Full control
- Cost-effective for steady traffic
- Can use reserved instances

**Cons:**

- Server management required
- Manual scaling setup
- OS updates needed

**Best for:** Cost optimization, specific requirements

### Option 3: AWS App Runner (Easiest)

**Pros:**

- Simplest deployment
- Auto-scaling
- Built-in CI/CD
- No infrastructure management

**Cons:**

- Less control
- Limited customization
- Newer service

**Best for:** Quick deployment, small teams

### Option 4: Lambda + API Gateway (Serverless)

**Pros:**

- True serverless
- Pay per request
- Infinite scaling

**Cons:**

- Cold starts
- 15-minute timeout
- Requires code changes

**Best for:** Low traffic, cost optimization

---

## 🚀 Deployment Steps

## Part 1: Backend Deployment (ECS Fargate - Recommended)

### Step 1: Prepare Backend for AWS

#### 1.1 Create Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/server.js"]
```

#### 1.2 Create .dockerignore

```
# backend/.dockerignore
node_modules
dist
.env
.env.*
*.md
.git
.gitignore
*.log
coverage
.vscode
.idea
```

#### 1.3 Test Docker Build Locally

```bash
cd backend

# Build image
docker build -t mibo-backend .

# Test locally
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://mibo_admin:mibo#aws2026@mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com:5432/mibodb?sslmode=require" \
  -e JWT_ACCESS_SECRET="your-secret" \
  -e JWT_REFRESH_SECRET="your-secret" \
  -e GALLABOX_API_KEY="your-key" \
  -e GALLABOX_API_SECRET="your-secret" \
  -e GALLABOX_CHANNEL_ID="your-id" \
  -e RAZORPAY_KEY_ID="your-key" \
  -e RAZORPAY_KEY_SECRET="your-secret" \
  -e CORS_ORIGIN="*" \
  mibo-backend

# Test health endpoint
curl http://localhost:5000/api/health
```

### Step 2: Push to Amazon ECR (Elastic Container Registry)

```bash
# Login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name mibo-backend --region eu-north-1

# Tag image
docker tag mibo-backend:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/mibo-backend:latest

# Push image
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/mibo-backend:latest
```

### Step 3: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name mibo-cluster --region eu-north-1
```

### Step 4: Create Task Definition

Create `backend/ecs-task-definition.json`:

```json
{
  "family": "mibo-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "mibo-backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/mibo-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:mibo/database-url"
        },
        {
          "name": "JWT_ACCESS_SECRET",
          "valueFrom": "arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:mibo/jwt-access"
        },
        {
          "name": "JWT_REFRESH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:mibo/jwt-refresh"
        },
        {
          "name": "GALLABOX_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:mibo/gallabox-key"
        },
        {
          "name": "GALLABOX_API_SECRET",
          "valueFrom": "arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:mibo/gallabox-secret"
        },
        {
          "name": "GALLABOX_CHANNEL_ID",
          "valueFrom": "arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:mibo/gallabox-channel"
        },
        {
          "name": "RAZORPAY_KEY_ID",
          "valueFrom": "arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:mibo/razorpay-key"
        },
        {
          "name": "RAZORPAY_KEY_SECRET",
          "valueFrom": "arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:mibo/razorpay-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mibo-backend",
          "awslogs-region": "eu-north-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:5000/api/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Step 5: Store Secrets in AWS Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name mibo/database-url \
  --secret-string "postgresql://mibo_admin:mibo#aws2026@mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com:5432/mibodb?sslmode=require" \
  --region eu-north-1

# JWT Secrets
aws secretsmanager create-secret \
  --name mibo/jwt-access \
  --secret-string "your-production-jwt-access-secret-min-32-chars" \
  --region eu-north-1

aws secretsmanager create-secret \
  --name mibo/jwt-refresh \
  --secret-string "your-production-jwt-refresh-secret-min-32-chars" \
  --region eu-north-1

# Gallabox
aws secretsmanager create-secret \
  --name mibo/gallabox-key \
  --secret-string "695652f2540814a19bebf8b5" \
  --region eu-north-1

aws secretsmanager create-secret \
  --name mibo/gallabox-secret \
  --secret-string "edd9fb89a68548d6a7fb080ea8255b1e" \
  --region eu-north-1

aws secretsmanager create-secret \
  --name mibo/gallabox-channel \
  --secret-string "693a63bfeba0dac02ac3d624" \
  --region eu-north-1

# Razorpay
aws secretsmanager create-secret \
  --name mibo/razorpay-key \
  --secret-string "rzp_test_Rv16VKPj91R00I" \
  --region eu-north-1

aws secretsmanager create-secret \
  --name mibo/razorpay-secret \
  --secret-string "lVTIWgJw36ydSFnDeGmaKIBx" \
  --region eu-north-1
```

### Step 6: Create Application Load Balancer

```bash
# Create security group for ALB
aws ec2 create-security-group \
  --group-name mibo-alb-sg \
  --description "Security group for Mibo ALB" \
  --vpc-id YOUR_VPC_ID \
  --region eu-north-1

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region eu-north-1

aws ec2 authorize-security-group-ingress \
  --group-id YOUR_ALB_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region eu-north-1

# Create ALB
aws elbv2 create-load-balancer \
  --name mibo-alb \
  --subnets YOUR_SUBNET_1 YOUR_SUBNET_2 \
  --security-groups YOUR_ALB_SG_ID \
  --region eu-north-1

# Create target group
aws elbv2 create-target-group \
  --name mibo-backend-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id YOUR_VPC_ID \
  --target-type ip \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region eu-north-1
```

### Step 7: Create ECS Service

```bash
aws ecs create-service \
  --cluster mibo-cluster \
  --service-name mibo-backend-service \
  --task-definition mibo-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[YOUR_SUBNET_1,YOUR_SUBNET_2],securityGroups=[YOUR_ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=YOUR_TARGET_GROUP_ARN,containerName=mibo-backend,containerPort=5000" \
  --region eu-north-1
```

---

## Part 2: Frontend Deployment (S3 + CloudFront)

### Step 1: Build Frontend for Production

```bash
cd mibo_version-2

# Update environment variables for production
echo "VITE_API_BASE_URL=https://api.mibo.com/api" > .env.production

# Build
npm run build

# Output will be in dist/ folder
```

### Step 2: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://mibo-frontend --region eu-north-1

# Enable static website hosting
aws s3 website s3://mibo-frontend \
  --index-document index.html \
  --error-document index.html

# Upload build files
aws s3 sync dist/ s3://mibo-frontend --delete

# Set bucket policy for CloudFront
aws s3api put-bucket-policy --bucket mibo-frontend --policy file://s3-bucket-policy.json
```

Create `s3-bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mibo-frontend/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### Step 3: Create CloudFront Distribution

Create `cloudfront-config.json`:

```json
{
  "CallerReference": "mibo-frontend-2026",
  "Comment": "Mibo Healthcare Frontend",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-mibo-frontend",
        "DomainName": "mibo-frontend.s3.eu-north-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-mibo-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
```

```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

---

## 🔐 Security Checklist

- [ ] Enable AWS WAF on CloudFront and ALB
- [ ] Use AWS Secrets Manager for all secrets
- [ ] Enable RDS encryption at rest
- [ ] Enable RDS automated backups
- [ ] Configure RDS Multi-AZ for high availability
- [ ] Use VPC with private subnets for ECS tasks
- [ ] Enable CloudTrail for audit logging
- [ ] Set up CloudWatch alarms for monitoring
- [ ] Use IAM roles with least privilege
- [ ] Enable MFA for AWS root account
- [ ] Rotate secrets regularly
- [ ] Use ACM for SSL/TLS certificates

---

## 💰 Cost Estimation (Monthly)

### Backend (ECS Fargate - 2 tasks)

- Fargate: ~$30-50
- ALB: ~$20
- ECR: ~$1
- CloudWatch Logs: ~$5

### Frontend (S3 + CloudFront)

- S3 Storage: ~$1
- S3 Requests: ~$1
- CloudFront: ~$10-30 (depends on traffic)

### Database (RDS PostgreSQL)

- Already running: Check current cost

### Total Estimated: ~$70-110/month

(Excluding RDS, which you already have)

---

## 📊 Monitoring & Logging

### CloudWatch Dashboards

- Backend API metrics
- RDS performance
- CloudFront cache hit ratio
- ALB request count

### CloudWatch Alarms

- High CPU usage
- High memory usage
- Database connections
- 5xx errors
- Health check failures

---

## 🔄 CI/CD Pipeline (Optional)

Use AWS CodePipeline + CodeBuild:

1. Push code to GitHub
2. CodePipeline triggers
3. CodeBuild builds Docker image
4. Push to ECR
5. Update ECS service
6. Deploy frontend to S3
7. Invalidate CloudFront cache

---

## 📝 Next Steps

1. ✅ Test backend locally with AWS RDS (already set up)
2. ⏳ Create Dockerfile for backend
3. ⏳ Push to ECR
4. ⏳ Create ECS cluster and service
5. ⏳ Build frontend for production
6. ⏳ Deploy to S3 + CloudFront
7. ⏳ Configure custom domain (Route 53)
8. ⏳ Set up SSL certificates (ACM)
9. ⏳ Configure monitoring and alarms
10. ⏳ Set up CI/CD pipeline

---

## 🆘 Support Resources

- AWS Documentation: https://docs.aws.amazon.com
- ECS Best Practices: https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide
- CloudFront Guide: https://docs.aws.amazon.com/cloudfront
- RDS Best Practices: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide

---

**Your application is 100% AWS-ready! No code changes needed.**
