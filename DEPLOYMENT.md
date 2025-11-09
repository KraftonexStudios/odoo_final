# OneFlow Deployment Guide

## 🚀 Quick Start

### Development

1. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

2. **Set up environment:**
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

3. **Run database migrations:**
\`\`\`bash
npx prisma db push
\`\`\`

4. **Start dev server:**
\`\`\`bash
npm run dev
\`\`\`

## 🐳 Docker Deployment

### Development with Docker

1. **Create environment file:**
\`\`\`bash
cp .docker.env.example .env
# Edit .env with your configuration
\`\`\`

2. **Start services:**
\`\`\`bash
docker-compose up
\`\`\`

3. **Access application:**
- App: http://localhost:3000
- Database: localhost:5432

### Production Deployment

1. **Configure environment:**
\`\`\`bash
cp .docker.env.example .env.production
# Edit .env.production with production values
\`\`\`

2. **Build and start:**
\`\`\`bash
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

3. **SSL Certificates:**
Place your SSL certificates in `nginx/ssl/`:
- `cert.pem` - SSL certificate
- `key.pem` - Private key

Or generate self-signed certificates for testing:
\`\`\`bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
  -keyout nginx/ssl/key.pem \\
  -out nginx/ssl/cert.pem
\`\`\`

### Production Checklist

- [ ] Update DATABASE_URL with production database
- [ ] Set strong POSTGRES_PASSWORD
- [ ] Configure Clerk with production keys
- [ ] Add SSL certificates to nginx/ssl/
- [ ] Set NEXT_PUBLIC_API_URL to your domain
- [ ] Review nginx rate limiting settings
- [ ] Set up database backups
- [ ] Configure monitoring (optional)

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key

**Optional:**
- `NEXT_PUBLIC_API_URL` - API URL for Socket.IO
- `POSTGRES_USER` - Database user (Docker)
- `POSTGRES_PASSWORD` - Database password (Docker)
- `POSTGRES_DB` - Database name (Docker)

### Nginx Configuration

**Development:** Uses `nginx/nginx.conf`
- HTTP only on port 80
- WebSocket support
- Basic rate limiting

**Production:** Uses `nginx/nginx.prod.conf`
- HTTPS on port 443
- HTTP to HTTPS redirect
- Advanced security headers
- Aggressive caching
- Strict rate limiting

## 📊 Database Migrations

### Apply migrations:
\`\`\`bash
npx prisma migrate deploy
\`\`\`

### Generate Prisma Client:
\`\`\`bash
npx prisma generate
\`\`\`

### View database:
\`\`\`bash
npx prisma studio
\`\`\`

## 🔍 Monitoring

### View logs:

**Docker logs:**
\`\`\`bash
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f postgres
\`\`\`

**Application logs:**
Check browser console and server terminal for errors.

### Health checks:

- **App health:** http://localhost/health
- **Database:** Check PostgreSQL connection

## 🔐 Security

### Production Security Checklist

- [ ] Enable HTTPS (SSL certificates configured)
- [ ] Use strong database passwords
- [ ] Enable Clerk production mode
- [ ] Review CORS settings
- [ ] Configure rate limiting appropriately
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Review user permissions
- [ ] Enable audit logging
- [ ] Set up monitoring/alerts

## 🎯 Performance Optimization

### Implemented
- ✅ TanStack Query caching (5-minute staleTime)
- ✅ Static asset caching (nginx)
- ✅ Gzip compression
- ✅ Image optimization
- ✅ React 19 compiler optimizations
- ✅ Optimistic UI updates

### Recommended
- Add CDN for static assets
- Enable database connection pooling
- Configure Redis for session storage
- Add service worker for offline support
- Implement lazy loading for images
- Add virtual scrolling for large lists

## 🆘 Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check database credentials

**"Clerk authentication failed"**
- Verify Clerk keys in .env
- Check Clerk dashboard for API status
- Ensure domain is whitelisted in Clerk

**"Nginx won't start"**
- Check SSL certificate paths
- Verify ports 80/443 are available
- Review nginx error logs

**"React Beautiful DnD not working"**
- Installed with `--legacy-peer-deps` for React 19
- Check console for errors
- Verify touch events on mobile

## 📦 Building for Production

1. **Build the application:**
\`\`\`bash
npm run build
\`\`\`

2. **Test production build locally:**
\`\`\`bash
npm run start
\`\`\`

3. **Deploy with Docker:**
\`\`\`bash
docker-compose -f docker-compose.prod.yml up -d --build
\`\`\`

## 🔄 Updates & Maintenance

### Updating dependencies:
\`\`\`bash
npm update
npm audit fix
\`\`\`

### Database schema changes:
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push` (dev) or `npx prisma migrate dev` (production)
3. Restart application

### Backing up data:
\`\`\`bash
# Export database
docker exec client-rewire-db-prod pg_dump -U postgres oneflow > backup.sql

# Import database
docker exec -i client-rewire-db-prod psql -U postgres oneflow < backup.sql
\`\`\`

---

**For support or questions, refer to FINAL_IMPLEMENTATION_REPORT.md**

