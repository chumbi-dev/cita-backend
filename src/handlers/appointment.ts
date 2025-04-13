import { APIGatewayProxyHandler } from 'aws-lambda';
import { AppointmentService } from '../application/AppointmentService';
import { AppointmentRepository } from '../infrastructure/dynamo/AppointmentRepository';
import { Appointment } from '../domain/Appointment';

export const createAppointment: APIGatewayProxyHandler = async (event) => {
  const data = JSON.parse(event.body || '{}');

  const appointment: Appointment = {
    insuredId: data.insuredId,
    scheduleId: data.scheduleId,
    countryISO: data.countryISO,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const service = new AppointmentService(new AppointmentRepository());
  await service.create(appointment);

  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'Agendamiento registrado con éxito' }),
  };
};
