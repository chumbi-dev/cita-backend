import { SQSEvent } from 'aws-lambda';
import mysql from 'mysql2/promise';

export const handler = async (event: SQSEvent): Promise<void> => {
  try {
    const messages = event.Records.map(record => JSON.parse(record.body));

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_PE_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB_PE,
    });

    for (const appointment of messages) {
      await connection.execute(
        `INSERT INTO appointments 
         (insuredId, scheduleId, countryISO, status, createdAt) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          appointment.insuredId,
          appointment.scheduleId,
          appointment.countryISO,
          appointment.status,
          appointment.createdAt
        ]
      );
    }

    await connection.end();
  } catch (error) {
    console.error('Error al insertar citas en MySQL PE:', error);
    throw error;
  }
};
