# Incident Response Procedures

## Overview

This document outlines the procedures for responding to incidents affecting the DuetRight IT Dashboard. Follow these procedures to minimize impact, restore service quickly, and prevent recurrence.

## Incident Classification

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P1 - Critical** | Complete service outage or data loss | 15 minutes | System down, data breach, critical security vulnerability |
| **P2 - High** | Major functionality impaired | 1 hour | Authentication failure, API errors >50%, database issues |
| **P3 - Medium** | Minor functionality impaired | 4 hours | Slow performance, individual feature failure |
| **P4 - Low** | Minimal impact | 24 hours | UI issues, non-critical bugs |

## Response Team

### Roles and Responsibilities

| Role | Primary Contact | Backup Contact | Responsibilities |
|------|----------------|----------------|------------------|
| Incident Commander | John Doe (+1-XXX-XXX-XXXX) | Jane Smith | Overall incident coordination |
| Technical Lead | Tech Lead | Senior Dev | Technical investigation and resolution |
| Communications Lead | PR Manager | Marketing | Stakeholder communication |
| Security Lead | Security Officer | CISO | Security-related incidents |

### Escalation Matrix

```
P1 Incidents: Immediate notification to all roles
P2 Incidents: Technical Lead + Incident Commander
P3 Incidents: Technical Lead + On-call Engineer
P4 Incidents: On-call Engineer
```

## Incident Response Phases

### 1. Detection & Alert

**Automated Detection:**
- Monitoring alerts (Prometheus/Grafana)
- Health check failures
- Error rate thresholds exceeded
- Customer reports via support channels

**Initial Actions:**
```bash
# Verify the incident
curl -I https://dashboard.duetright.com/api/health

# Check monitoring dashboard
open https://grafana.duetright.com

# Review recent deployments
git log --oneline -10
kubectl rollout history deployment/duetright-dashboard
```

### 2. Triage & Classification

**Assessment Checklist:**
- [ ] Number of users affected
- [ ] Business functions impacted
- [ ] Data integrity concerns
- [ ] Security implications
- [ ] Customer-facing impact

**Classification Decision Tree:**
```
Is the service completely down? → P1
Is authentication broken? → P1
Are >50% of API calls failing? → P2
Is a critical feature broken? → P2
Is performance degraded >50%? → P3
Other issues → P4
```

### 3. Response & Mitigation

#### P1 Critical Response Playbook

**Immediate Actions (0-15 minutes):**

1. **Create Incident Channel**
```bash
# Slack command
/incident create "Dashboard Outage - P1"
```

2. **Implement Quick Fix**
```bash
# Rollback if recent deployment
kubectl rollout undo deployment/duetright-dashboard

# Or restart services
docker-compose restart dashboard

# Or failover to backup
./scripts/failover-to-backup.sh
```

3. **Notify Stakeholders**
```
Template: "We are aware of an issue affecting the DuetRight Dashboard. 
Our team is investigating and working to restore service. 
Updates will be provided every 15 minutes."
```

**Investigation (15-30 minutes):**

```bash
# Check logs
kubectl logs deployment/duetright-dashboard --tail=1000 | grep ERROR

# Check system resources
kubectl top nodes
kubectl top pods

# Database health
redis-cli ping
curl http://localhost:5001/api/health/services

# Recent changes
git diff HEAD~1
```

#### P2 High Response Playbook

**Actions (0-60 minutes):**

1. **Isolate the Problem**
```bash
# Check specific service health
curl http://localhost:5001/api/health/services/auth
curl http://localhost:5001/api/health/services/database

# Review error patterns
grep -E "ERROR|CRITICAL" /var/log/dashboard/app.log | tail -100
```

2. **Temporary Mitigation**
```bash
# Increase resources if needed
kubectl scale deployment/duetright-dashboard --replicas=5

# Clear cache if corruption suspected
redis-cli FLUSHDB

# Enable maintenance mode
kubectl set env deployment/duetright-dashboard MAINTENANCE_MODE=true
```

### 4. Resolution

**Fix Implementation:**
```bash
# Apply hotfix
git checkout -b hotfix/incident-XXX
# Make necessary changes
git commit -m "Hotfix: Resolve P1 incident XXX"
git push origin hotfix/incident-XXX

# Deploy fix
kubectl set image deployment/duetright-dashboard \
  dashboard=duetright/dashboard:hotfix-XXX

# Verify fix
./scripts/smoke-test.sh
```

**Verification Steps:**
- [ ] Health checks passing
- [ ] Error rates back to normal
- [ ] Performance metrics acceptable
- [ ] Affected features working
- [ ] No new errors introduced

### 5. Recovery

**Service Restoration:**
```bash
# Remove maintenance mode
kubectl set env deployment/duetright-dashboard MAINTENANCE_MODE-

# Scale back to normal
kubectl scale deployment/duetright-dashboard --replicas=3

# Clear any temporary flags
redis-cli DEL incident:flags:*
```

**Data Recovery (if needed):**
```bash
# Restore from backup
./scripts/restore.sh --timestamp "2025-07-13 10:00:00"

# Verify data integrity
node scripts/data-integrity-check.js

# Resync external services
node scripts/resync-external-services.js
```

### 6. Post-Incident

**Documentation Requirements:**
- Incident timeline
- Root cause analysis
- Actions taken
- Lessons learned
- Prevention measures

**Post-Mortem Template:**
```markdown
# Incident Post-Mortem: INC-YYYY-MM-DD-XXX

## Summary
- **Date**: YYYY-MM-DD
- **Duration**: XX minutes
- **Impact**: XXX users affected
- **Severity**: P1/P2/P3/P4

## Timeline
- HH:MM - Alert triggered
- HH:MM - Team notified
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Service restored

## Root Cause
[Detailed explanation]

## Resolution
[Steps taken to resolve]

## Lessons Learned
1. What went well
2. What went poorly
3. Where we got lucky

## Action Items
- [ ] Implement monitoring for X
- [ ] Add automated failover for Y
- [ ] Update runbook for Z
```

## Specific Incident Types

### Security Incidents

**Immediate Actions:**
```bash
# Isolate affected systems
sudo ufw deny from any to any

# Preserve evidence
sudo tar -czf /evidence/incident-$(date +%s).tar.gz \
  /var/log /opt/duetright-dashboard/logs

# Rotate all credentials
./scripts/rotate-credentials.sh --all

# Enable enhanced logging
kubectl set env deployment/duetright-dashboard \
  LOG_LEVEL=debug SECURITY_AUDIT=true
```

### Data Loss Incidents

**Recovery Steps:**
```bash
# Stop writes to prevent further loss
kubectl set env deployment/duetright-dashboard READ_ONLY_MODE=true

# Identify extent of loss
node scripts/data-audit.js --from "2 hours ago"

# Restore from closest backup
./scripts/restore.sh --partial --tables affected_tables

# Replay transaction logs
node scripts/replay-transactions.js --from "backup_timestamp"
```

### Performance Degradation

**Diagnosis:**
```bash
# CPU profiling
kubectl exec -it dashboard-pod -- \
  node --cpu-prof --cpu-prof-duration=30

# Memory analysis
kubectl exec -it dashboard-pod -- \
  node --heapsnapshot-signal=SIGUSR2

# Query analysis
redis-cli SLOWLOG GET 10

# Network diagnosis
tcpdump -i any -w network-trace.pcap
```

## Communication Templates

### Customer Communication

**Initial Notice:**
```
Subject: DuetRight Dashboard - Service Issue

We are currently experiencing issues with the DuetRight Dashboard. 
Our team is actively working to resolve the problem.

Impact: [Brief description of impact]
Started: [Time]
Expected Resolution: [ETA if available]

We apologize for any inconvenience and will provide updates every [frequency].
```

**Resolution Notice:**
```
Subject: DuetRight Dashboard - Service Restored

The issues affecting the DuetRight Dashboard have been resolved.

Duration: [Start time] to [End time]
Impact: [What was affected]
Cause: [Brief, non-technical explanation]

We apologize for the disruption and have taken steps to prevent similar issues.
```

### Internal Communication

**Slack Alert Template:**
```
@channel
🚨 INCIDENT ALERT - [P1/P2/P3/P4]
Service: DuetRight Dashboard
Issue: [Brief description]
Impact: [User impact]
IC: @[incident-commander]
Thread: [Link to incident channel]
```

## Preventive Measures

### Regular Drills
- Monthly P3/P4 incident simulation
- Quarterly P1/P2 incident simulation
- Annual disaster recovery exercise

### Automation Improvements
```yaml
# Auto-remediation rules
- condition: "error_rate > 10%"
  action: "restart_service"
  
- condition: "memory_usage > 90%"
  action: "scale_up"
  
- condition: "response_time > 2s"
  action: "enable_cache_mode"
```

### Documentation Updates
- Review and update runbooks monthly
- Capture new incident patterns
- Update contact information quarterly
- Test communication channels weekly

## Tools and Resources

### Monitoring Dashboards
- Main Dashboard: https://grafana.duetright.com/d/main
- Security Dashboard: https://grafana.duetright.com/d/security
- Performance Dashboard: https://grafana.duetright.com/d/performance

### Key Commands
```bash
# Quick health check
curl https://dashboard.duetright.com/api/health/detailed | jq .

# Service restart
./scripts/restart-service.sh

# Emergency rollback
./scripts/emergency-rollback.sh

# Status page update
./scripts/update-status-page.sh "Investigating issue with authentication"
```

### External Resources
- Status Page: https://status.duetright.com
- Cloud Provider Status: https://status.aws.amazon.com
- Security Advisories: https://cve.mitre.org

---

**Document Version**: 1.0
**Last Updated**: July 2025
**Next Review**: October 2025
**Owner**: DevOps Team