# 📅 Cita Backend - Reto Técnico

Este proyecto implementa un backend serverless para gestionar citas médicas en distintos países usando AWS. La arquitectura desacopla el flujo de ingreso de citas, procesado por país y actualización de estado.

---

## 🏗️ Arquitectura General

```
Cliente 
  |
  |-- POST /appointments (insuredId, scheduleId, countryISO)
        |
        v
API Gateway
        |
        v
Lambda: createAppointment
        |
        v
SNS Topic
        |
        +---> SQS_PE (Filtro: countryISO = "PE")
        |
        +---> SQS_CL (Filtro: countryISO = "CL")
                    |
                    v
Lambda: processAppointmentPE / processAppointmentCL
                    |
                    v
MySQL RDS por país (citas_pe / citas_cl)
                    |
                    v
(Si la inserción es exitosa)
                    |
                    v
EventBridge (appointment.result)
                    |
                    v
Lambda: handleEventBridgeResponse
                    |
                    v
DynamoDB: AppointmentsTable (actualiza estado a "completed")
```

---

## 📦 Tecnologías Utilizadas

- **AWS Lambda** - Para manejar toda la lógica sin servidores.
- **API Gateway** - Para exponer el endpoint HTTP.
- **SNS + SQS** - Para enrutar citas por país con filtro por `countryISO`.
- **MySQL (RDS)** - Una base por país (`citas_pe`, `citas_cl`).
- **DynamoDB** - Base central para el estado de citas.
- **EventBridge** - Para orquestar eventos una vez procesada la cita.
- **Serverless Framework** - Para despliegue automatizado.

---

## 📁 Estructura del Proyecto

```
src/
  handlers/
    appointment.ts                # Crear cita y publicar en SNS
    appointment_pe.ts             # Consumir SQS PE y registrar en MySQL PE
    appointment_cl.ts             # Consumir SQS CL y registrar en MySQL CL
    eventbridge.ts                # Escucha desde EventBridge y actualiza DynamoDB
  infrastructure/
    dynamo/                       # Repositorio DynamoDB
    sns/                          # Publicador SNS
  domain/                         # Modelo de dominio
  application/                    # Servicios de aplicación
```

---

## 🔐 Variables de Entorno

Definidas en `serverless.ts` dentro de `provider.environment`:

```ts
MYSQL_USER, MYSQL_PASSWORD
MYSQL_PE_HOST, MYSQL_CL_HOST
MYSQL_DB_PE, MYSQL_DB_CL
DYNAMO_TABLE
SNS_TOPIC_ARN
SQS_QUEUE_PE_URL, SQS_QUEUE_CL_URL
EVENT_BUS_NAME
```

---

## 🧪 Ejemplo de Petición

```json
{
  "insuredId": "00001",
  "scheduleId": "SCHED01",
  "countryISO": "PE"
}
```

---

## 🚀 Despliegue

```bash
npm install
npx serverless deploy
```

---

## 👨‍💻 Autor
Carlos Alvarez Chumbiauca
