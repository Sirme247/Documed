# Orthanc DICOM Server Setup

## Quick Start

1. Start Orthanc:
   ```bash
   docker-compose up -d
   ```

2. Access Orthanc:
   - Web Interface: http://localhost:8042
   - Username: admin
   - Password: password (or from .env)

3. Stop Orthanc:
   ```bash
   docker-compose down
   ```

## Useful Commands

### View Logs
```bash
docker-compose logs -f orthanc
```

### Check Status
```bash
docker-compose ps
```

### Restart Orthanc
```bash
docker-compose restart
```

### Backup Data
```bash
docker-compose exec orthanc tar czf /tmp/orthanc-backup.tar.gz /var/lib/orthanc
docker cp orthanc-dicom-server:/tmp/orthanc-backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

### View Orthanc Stats
```bash
curl -u admin:password http://localhost:8042/statistics
```

## Configuration

- `orthanc.json`: Main configuration file
- `.env`: Environment variables (credentials)
- Volumes:
  - `orthanc-db`: Database files
  - `orthanc-storage`: DICOM file storage

## Ports

- `8042`: HTTP/REST API and Web Interface
- `4242`: DICOM protocol (for PACS systems)

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. Change default credentials in `.env`
2. Use strong passwords
3. Consider using HTTPS/TLS
4. Restrict network access
5. Regular backups

## API Access

Test API access:
```bash
curl -u admin:password http://localhost:8042/system
```

## Integration with Backend

Your backend should connect using:
- URL: `http://localhost:8042`
- Username: From `ORTHANC_USERNAME`
- Password: From `ORTHANC_PASSWORD`

## Troubleshooting

### Container won't start
```bash
docker-compose logs orthanc
```

### Reset everything
```bash
docker-compose down -v  # WARNING: Deletes all data
docker-compose up -d
```

### Check disk usage
```bash
docker exec orthanc-dicom-server du -sh /var/lib/orthanc/storage
```