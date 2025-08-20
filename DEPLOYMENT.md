# Deployment Configuration Files

## Vercel Configuration
vercel.json - Frontend deployment settings

## Render Configuration
- Backend deployment will use the server/ directory
- Environment variables need to be set in Render dashboard

## Environment Variables Needed:
- MONGODB_URI (your Atlas connection string)
- JWT_SECRET 
- EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, SENDER_EMAIL
- NODE_ENV=production
