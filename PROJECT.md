# Home Energy Dashboard — Project Overview

## Summary

A self-hosted, local-network web application built with **Next.js** that monitors and controls smart home devices — specifically a **Midea air conditioner** and multiple **NOUS A1T smart plugs** running **Tasmota firmware**. The goal is to have a real-time energy monitoring dashboard accessible from any device on the home network (browser, phone).

---

## Devices

| Device                                                | Protocol                                 | Purpose                      |
| ----------------------------------------------------- | ---------------------------------------- | ---------------------------- |
| Midea split air conditioner (~3.5kW cooling capacity) | WiFi / Local API (`midea-beautiful-air`) | Status monitoring + control  |
| NOUS A1T Smart Plug × 4 (Tasmota, 16A)                | WiFi / Tasmota REST API                  | Power consumption monitoring |

### Smart Plug Assignments (planned)

- **Plug 1** — Air conditioner
- **Plug 2** — Desktop computer
- **Plug 3 & 4** — Reserved for future devices

---

## Goals

### 1. Real-time Monitoring

- Display live power consumption (W, kWh, Voltage, Ampere) for each plug
- Display current air conditioner status: on/off, mode, target temperature, room temperature, fan speed

### 2. Historical Data & Charts

- Store consumption data in a local PostgreSQL database
- Display charts for each device: hourly / daily / weekly / monthly views
- Show total combined energy consumption across all plugs

### 3. Cost Estimation

- Calculate estimated electricity cost in **HUF** based on consumption
- Configurable electricity price (HUF/kWh)
- Daily / monthly cost summaries

### 4. Air Conditioner Control

- Turn the AC on/off remotely via the dashboard
- Set target temperature
- Change operating mode (cool / heat / fan / dry / auto)
- Change fan speed

### 5. Dashboard UI

- Clean, modern, responsive design (works on desktop and mobile browser)
- Auto-refreshing data (no manual page reload needed)
- Device cards with status indicators
- Navigation between overview and per-device detail pages

---

## Technical Stack

| Layer              | Technology                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Frontend + API     | Next.js (React)                                                                                      |
| Database           | PostgreSQL                                                                                           |
| AC communication   | `midea-beautiful-air` Python library (via Next.js API route calling a Python script or microservice) |
| Plug communication | Tasmota REST API (`http://<plug-ip>/cm?cmnd=Status%208`)                                             |
| Data polling       | Background polling via Next.js API routes or a lightweight cron job                                  |
| Hosting            | Self-hosted on local network (Abacus.AI platform during development)                                 |

---

## Architecture Overview

```
Browser / Phone
      │
      ▼
Next.js App (dashboard UI)
      │
      ├── API Route: /api/plugs     → polls Tasmota REST API on each plug
      ├── API Route: /api/ac        → communicates with Midea AC via Python bridge
      ├── API Route: /api/history   → reads/writes PostgreSQL for historical data
      └── API Route: /api/cost      → calculates estimated HUF cost from kWh data
            │
            ├── NOUS A1T Plug 1 (AC)      http://<ip>/cm?cmnd=Status%208
            ├── NOUS A1T Plug 2 (PC)      http://<ip>/cm?cmnd=Status%208
            ├── NOUS A1T Plug 3 (spare)   http://<ip>/cm?cmnd=Status%208
            ├── NOUS A1T Plug 4 (spare)   http://<ip>/cm?cmnd=Status%208
            ├── Midea AC                  Local WiFi (midea-beautiful-air)
            └── PostgreSQL DB             Historical data storage
```

---

## Configuration (to be set up before first run)

- IP addresses of each NOUS A1T plug (assigned via router DHCP reservation)
- IP address of the Midea air conditioner
- Midea account credentials (email + password) for initial device discovery
- Electricity price in HUF/kWh (user-configurable in app settings)

---

## Future Ideas

- Push notifications when consumption exceeds a threshold
- Automation rules (e.g. turn off AC if nobody home)
- Export consumption data to CSV
- Support for additional Tasmota devices
- Temperature history chart from AC sensor

---

_Project started: 2026 | Stack: Next.js + PostgreSQL + Tasmota + Midea Local API_
