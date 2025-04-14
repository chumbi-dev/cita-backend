import { SQSEvent } from 'aws-lambda';
import mysql from 'mysql2/promise';
import AWS from 'aws-sdk';

const eventBridge = new AWS.EventBridge();

export const handler = async (event: SQSEvent): Promise<void> => {
  try {
    const messages = event.Records.map(record => JSON.parse(record.body));

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_CL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB_CL,
    });

    for (const appointment of messages) {
      const [result] = await connection.execute(
        `INSERT INTO appointments 
         (insuredId, scheduleId, countryISO, createdAt) 
         VALUES (?, ?, ?, ?)`,
        [
          appointment.insuredId,
          appointment.scheduleId,
          appointment.countryISO,
          appointment.createdAt
        ]
      );

      // Validación explícita del resultado
      if ('affectedRows' in result && result.affectedRows > 0) {
        // Publicar evento solo si la inserción fue exitosa
        await eventBridge.putEvents({
          Entries: [
            {
              EventBusName: process.env.EVENT_BUS_NAME!,
              Source: 'appointment.result',
              DetailType: 'AppointmentResult',
              Detail: JSON.stringify({
                insuredId: appointment.insuredId,
                createdAt: appointment.createdAt
              })
            }
          ]
        }).promise();
        console.log(`Evento publicado para insuredId ${appointment.insuredId}`);
      } else {
        console.warn(`No se insertó ninguna fila para insuredId ${appointment.insuredId}`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error al insertar citas en MySQL CL o al publicar en EventBridge:', error);
    throw error;
  }
};
