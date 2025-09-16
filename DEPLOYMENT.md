# Production Deployment Guide

This guide covers the production deployment of the Career Counseling Chat application using Docker containers.

## Prerequisites

- Docker and Docker Compose installed
- Production server with adequate resources (minimum 2GB RAM, 2 CPU cores)
- Domain name configured with SSL certificates
- PostgreSQL database (can be containerized or external)
- Environment variables configured

## Quick Start

1. **Clone and configure the application:**

   ```bash
   git clone <repository-url>
   cd career-counseling-chat
   cp .env.production.example .env.production
   ```

2. **Configure environment variables:**
   Edit `.env.production` with your production values:

   ```bash
   nano .env.production
   ```

3. **Deploy the application:**
   ```bash
   npm run prod:deploy
   ```

## Detailed Deployment Steps

### 1. Environment Configuration

Copy the production environment template:

```bash
cp .env.production.example .env.production
```

Configure the following required variables in `.env.production`:

#### Database Configuration

```env
DATABASE_URL="postgresql://username:password@host:5432/career_counseling_chat?sslmode=require"
POSTGRES_USER="your_db_user"
POSTGRES_PASSWORD="your_secure_password"
POSTGRES_DB="career_counseling_chat"
```

#### Authentication

```env
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-very-secure-secret-at-least-32-characters"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

#### AI Service

```env
OPENAI_API_KEY="your-openai-api-key"
```

#### Email Configuration (Optional)

```env
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="your-sendgrid-api-key"
EMAIL_FROM="noreply@your-domain.com"
```

### 2. SSL Certificate Setup

Place your SSL certificates in the `nginx/ssl/` directory:

```bash
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/cert.pem
cp your-private-key.pem nginx/ssl/key.pem
```

Update the domain name in `nginx/nginx.conf`:

```nginx
server_name your-domain.com www.your-domain.com;
```

### 3. Database Setup

#### Option A: Using Containerized PostgreSQL (Recommended for development)

The Docker Compose configuration includes a PostgreSQL container that will be automatically set up.

#### Option B: Using External PostgreSQL Database

1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in `.env.production`
3. Remove the `postgres` service from `docker-compose.production.yml`

### 4. Deployment Commands

#### Full Deployment

```bash
npm run prod:deploy
```

This command will:

- Check prerequisites
- Build Docker images
- Deploy all services
- Run database migrations
- Perform health checks

#### Manual Deployment Steps

```bash
# Build images
npm run docker:build

# Start services
npm run docker:up

# Run database setup
npm run prod:setup

# Check health
npm run prod:health
```

### 5. Monitoring and Maintenance

#### View Logs

```bash
npm run docker:logs
```

#### Health Check

```bash
npm run prod:health
```

#### Database Migrations

```bash
npm run db:migrate:prod
```

#### Rollback Deployment

```bash
npm run prod:rollback
```

## Production Architecture

```
Internet → Nginx (SSL/Reverse Proxy) → Next.js App → PostgreSQL
                                    ↓
                                  Redis (Sessions)
```

### Services

1. **Nginx**: Reverse proxy with SSL termination and static file serving
2. **Next.js App**: Main application container
3. **PostgreSQL**: Database for persistent data
4. **Redis**: Session storage and caching (optional)

## Security Considerations

### Environment Security

- Use strong, unique passwords for all services
- Rotate secrets regularly
- Use environment-specific OAuth credentials
- Enable SSL/TLS for all connections

### Network Security

- Configure firewall rules to only allow necessary ports
- Use private networks for inter-service communication
- Enable fail2ban for SSH protection
- Regular security updates

### Application Security

- Rate limiting is enabled by default
- Security headers are configured in Nginx
- Input validation and sanitization
- CSRF protection enabled

## Performance Optimization

### Database Optimization

- Connection pooling configured
- Proper indexing in place
- Query optimization
- Regular maintenance tasks

### Application Optimization

- Static file caching
- Gzip compression enabled
- CDN integration recommended
- Image optimization

### Monitoring

- Health check endpoints
- Application metrics
- Error tracking with Sentry (optional)
- Log aggregation

## Backup and Recovery

### Database Backup

```bash
# Manual backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres career_counseling_chat > backup.sql

# Automated backup (add to cron)
0 2 * * * /path/to/backup-script.sh
```

### Application Backup

- Docker images are versioned
- Configuration files in version control
- Environment variables documented

### Recovery Process

1. Restore database from backup
2. Deploy previous application version
3. Verify functionality
4. Update DNS if necessary

## Troubleshooting

### Common Issues

#### Application Won't Start

1. Check environment variables
2. Verify database connectivity
3. Check Docker logs: `npm run docker:logs`
4. Verify SSL certificates

#### Database Connection Issues

1. Check `DATABASE_URL` format
2. Verify database server is running
3. Check network connectivity
4. Verify credentials

#### SSL Certificate Issues

1. Verify certificate files exist
2. Check certificate validity
3. Verify domain name matches
4. Check Nginx configuration

### Log Analysis

```bash
# Application logs
docker-compose -f docker-compose.production.yml logs app

# Database logs
docker-compose -f docker-compose.production.yml logs postgres

# Nginx logs
docker-compose -f docker-compose.production.yml logs nginx
```

### Performance Issues

1. Monitor resource usage
2. Check database query performance
3. Analyze application metrics
4. Review error rates

## Scaling Considerations

### Horizontal Scaling

- Load balancer configuration
- Session storage externalization
- Database read replicas
- CDN integration

### Vertical Scaling

- Increase container resources
- Database performance tuning
- Memory optimization
- CPU optimization

## Maintenance

### Regular Tasks

- Security updates
- Database maintenance
- Log rotation
- Certificate renewal
- Backup verification

### Update Process

1. Test updates in staging environment
2. Create backup
3. Deploy new version
4. Verify functionality
5. Monitor for issues

## Support

For deployment issues:

1. Check this documentation
2. Review application logs
3. Verify configuration
4. Check system resources
5. Contact support team

## Environment Variables Reference

| Variable                | Required | Description                  | Example                               |
| ----------------------- | -------- | ---------------------------- | ------------------------------------- |
| `DATABASE_URL`          | Yes      | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL`          | Yes      | Application URL              | `https://your-domain.com`             |
| `NEXTAUTH_SECRET`       | Yes      | Authentication secret        | `32+ character string`                |
| `GOOGLE_CLIENT_ID`      | Yes      | Google OAuth client ID       | `your-client-id`                      |
| `GOOGLE_CLIENT_SECRET`  | Yes      | Google OAuth secret          | `your-client-secret`                  |
| `OPENAI_API_KEY`        | Yes      | OpenAI API key               | `sk-...`                              |
| `EMAIL_SERVER_HOST`     | No       | SMTP server host             | `smtp.sendgrid.net`                   |
| `EMAIL_SERVER_PORT`     | No       | SMTP server port             | `587`                                 |
| `EMAIL_SERVER_USER`     | No       | SMTP username                | `apikey`                              |
| `EMAIL_SERVER_PASSWORD` | No       | SMTP password                | `your-api-key`                        |
| `EMAIL_FROM`            | No       | From email address           | `noreply@domain.com`                  |
