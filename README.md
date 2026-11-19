# Trionix Gear - Sistema de Préstamo de Equipos

**Estudiante:** JESUS(alias teen snake o leyenda)

## Descripción
Aplicación web para gestionar el inventario y los préstamos de equipos de Trionix Labs. Construida con Node.js, Express, MongoDB (Mongoose) y validación Joi. Desplegada usando Docker Compose y expuesta a internet con Cloudflare Tunnel.

## Requisitos
* Docker y Docker Compose instalados.

## Instrucciones de Ejecución
1. Clonar el repositorio.
2. Crear el archivo `.env` basado en `.env.example`.
3. Levantar los servicios:
   ```bash
   docker compose up -d --build
