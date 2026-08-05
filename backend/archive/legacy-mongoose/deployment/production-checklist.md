# Checklist production Fi Fow

## Sécurité

- [ ] `NODE_ENV=production`
- [ ] HTTPS actif via Nginx/Certbot
- [ ] CORS limité aux domaines mobile/admin
- [ ] Secrets absents du dépôt Git
- [ ] Rate limiting actif
- [ ] OTP hashé et non logué
- [ ] Webhook paiement signé
- [ ] Routes admin protégées
- [ ] Logs admin actifs
- [ ] Aucun delete physique sur données sensibles

## Base et stockage

- [ ] MongoDB Atlas en réseau sécurisé
- [ ] Index Mongoose synchronisés
- [ ] Backups automatiques activés
- [ ] Cloudinary configuré
- [ ] Limite upload vérifiée

## Déploiement

- [ ] PM2 ou Docker actif
- [ ] Health check `/api/health` OK
- [ ] Swagger accessible uniquement selon politique
- [ ] Monitoring logs
- [ ] Test restauration backup
